const FreeCard = () => {
  return (
    <div className="flex w-full flex-col rounded-[18px] bg-gradient-to-br from-green-50 to-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
        System Status
      </p>
      <p className="mt-1 text-sm text-gray-600">
        All core cyber crime services are operational. Monitor incidents and
        investigations from the dashboard.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">Open Complaints</p>
          <p className="text-lg font-semibold text-navy-700">128</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Healthy
        </span>
      </div>
    </div>
  );
};

export default FreeCard;
