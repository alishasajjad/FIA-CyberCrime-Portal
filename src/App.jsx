import React from "react";
import { Routes, Route } from "react-router-dom";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import PublicLayout from "layouts/public";

const App = () => {
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthLayout />} />
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/rtl/*" element={<RtlLayout />} />
      <Route path="/*" element={<PublicLayout />} />
    </Routes>
  );
};

export default App;
