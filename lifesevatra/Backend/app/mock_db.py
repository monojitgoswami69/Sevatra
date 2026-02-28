"""Mock Firestore and Dropbox clients for testing."""

import uuid

class MockQuery:
    def __init__(self, data, filters=None, orders=None, offset_val=0, limit_val=None):
        self.data = data
        self.filters = filters or []
        self.orders = orders or []
        self.offset_val = offset_val
        self.limit_val = limit_val

    def where(self, field, op, value):
        new_filters = list(self.filters)
        new_filters.append((field, op, value))
        return MockQuery(self.data, new_filters, self.orders, self.offset_val, self.limit_val)

    def order_by(self, field, **kwargs):
        new_orders = list(self.orders)
        new_orders.append((field, kwargs.get('direction', 'ASCENDING')))
        return MockQuery(self.data, self.filters, new_orders, self.offset_val, self.limit_val)

    def offset(self, val):
        return MockQuery(self.data, self.filters, self.orders, val, self.limit_val)

    def limit(self, val):
        return MockQuery(self.data, self.filters, self.orders, self.offset_val, val)

    def stream(self):
        result = []
        for doc in self.data.values():
            match = True
            for field, op, value in self.filters:
                val = doc.get(field)
                if op == "==" and val != value: match = False
                elif op == ">=" and (val is None or val < value): match = False
                elif op == "<=" and (val is None or val > value): match = False
            if match:
                result.append(MockDocSnap(doc['id'], doc))
        
        # very basic sort
        if self.orders:
            field = self.orders[0][0]
            desc = self.orders[0][1] == 'DESCENDING'
            result.sort(key=lambda x: str(x.to_dict().get(field, "")), reverse=desc)

        if self.limit_val:
            result = result[self.offset_val:self.offset_val + self.limit_val]
        else:
            result = result[self.offset_val:]
            
        return result

    def get(self):
        return self.stream()

class MockDocSnap:
    def __init__(self, key, data):
        self.id = key
        self._data = data
        self.exists = bool(data)
    def to_dict(self):
        return self._data

class MockDocRef:
    def __init__(self, parent, key):
        self.parent = parent
        self.id = key

    def get(self):
        data = self.parent.data.get(self.id)
        return MockDocSnap(self.id, data)

    def set(self, data, merge=False):
        if merge and self.id in self.parent.data:
            self.parent.data[self.id].update(data)
        else:
            self.parent.data[self.id] = data
            self.parent.data[self.id]['id'] = self.id

    def update(self, data):
        if self.id in self.parent.data:
            self.parent.data[self.id].update(data)

    def delete(self):
        if self.id in self.parent.data:
            del self.parent.data[self.id]

class MockCollection:
    def __init__(self):
        self.data = {}

    def document(self, key=None):
        if key is None:
            key = str(uuid.uuid4())
        return MockDocRef(self, str(key))

    def where(self, field, op, value):
        return MockQuery(self.data).where(field, op, value)

    def order_by(self, field, **kwargs):
        return MockQuery(self.data).order_by(field, **kwargs)

    def stream(self):
        return MockQuery(self.data).stream()
        
    def get(self):
        return self.stream()
        
    def count(self):
        class CountQuery:
            def __init__(self, col):
                self.col = col
            def get(self):
                return [[MockCount(len(self.col.data))]]
        return CountQuery(self)

class MockCount:
    def __init__(self, value):
        self.value = value

class MockFirestore:
    def __init__(self):
        self.collections = {}

    def collection(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection()
        return self.collections[name]
        
    def batch(self):
        return MockBatch()

class MockBatch:
    def set(self, ref, data): ref.set(data)
    def update(self, ref, data): ref.update(data)
    def delete(self, ref): ref.delete()
    def commit(self): pass

class MockDropbox:
    def files_upload(self, *args, **kwargs):
        class Res:
            path_display = "/mock/path.png"
        return Res()
    def sharing_create_shared_link_with_settings(self, *args, **kwargs):
        class Res:
            url = "https://dropbox.mock/link"
        return Res()
