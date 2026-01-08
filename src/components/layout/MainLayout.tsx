import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
