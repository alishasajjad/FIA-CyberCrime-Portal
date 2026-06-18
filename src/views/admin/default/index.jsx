const Dashboard = () => {
  return (
    <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-md shadow-shadow-500 dark:bg-navy-800">
      <h2 className="text-2xl font-semibold text-navy-700 dark:text-white">
        Legacy Dashboard
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        This is the original Horizon template dashboard. The primary landing
        page for the application is now the dedicated{" "}
        <span className="font-semibold">Cyber Crime Dashboard</span> accessible
        from the sidebar.
      </p>
    </div>
  );
};

export default Dashboard;
