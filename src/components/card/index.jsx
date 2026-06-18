function Card(props) {
  const { variant, extra, children, ...rest } = props;
  return (
    <div
      className={`!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-[0_10px_30px_rgba(22,101,52,0.05)] border border-green-50/80 dark:!bg-navy-800 dark:text-white dark:border-green-900/40 ${extra}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
