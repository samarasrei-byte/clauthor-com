import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const AppLayout = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-16">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
