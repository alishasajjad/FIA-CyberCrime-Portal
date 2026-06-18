import Card from "components/card";

const Widget = ({ icon, title, subtitle }) => {
  return (
    <Card extra="!flex-row flex-grow items-center rounded-[20px] bg-gradient-to-br from-white to-green-50/80">
      <div className="ml-[18px] flex h-[82px] w-auto flex-row items-center">
        <div className="rounded-2xl bg-green-100 p-3 dark:bg-navy-700">
          <span className="flex items-center text-green-700 dark:text-white">
            {icon}
          </span>
        </div>
      </div>

      <div className="h-50 ml-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-xs font-bold uppercase tracking-wider text-green-800 dark:text-green-300">
          {title}
        </p>
        <h4 className="mt-0.5 text-2xl font-bold text-navy-900 dark:text-white">
          {subtitle}
        </h4>
      </div>
    </Card>
  );
};

export default Widget;
