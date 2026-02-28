import React, { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  navTitle: React.ReactNode;
  navActions: React.ReactNode;
  setNavTitle: (title: React.ReactNode) => void;
  setNavActions: (actions: React.ReactNode) => void;
}

const NavbarContext = createContext<NavbarContextType>({
  navTitle: null,
  navActions: null,
  setNavTitle: () => {},
  setNavActions: () => {},
});

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navTitle, setNavTitle] = useState<React.ReactNode>(null);
  const [navActions, setNavActions] = useState<React.ReactNode>(null);

  return (
    <NavbarContext.Provider value={{ navTitle, navActions, setNavTitle, setNavActions }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => useContext(NavbarContext);
