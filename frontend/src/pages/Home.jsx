const Home = () => {
  return (
    <div
      className="flex justify-center items-center min-h-[calc(100vh-12rem)] px-2 sm:px-4"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
      <pre
        className="text-[8px] sm:text-[10px] md:text-[12px] lg:text-[14px]"
        style={{
          fontFamily: "'Courier New', monospace",
          lineHeight: 1.1,
          color: "black",
          whiteSpace: "pre",
          textAlign: "center",
        }}>
        {String.raw`
    ____                      __                   ________             
   /  _/___ _   _____  ____  / /_____  _______  __/ ____/ /___ _      __
   / // __ \ | / / _ \/ __ \/ __/ __ \/ ___/ / / / /_  / / __ \ | /| / /
 _/ // / / / |/ /  __/ / / / /_/ /_/ / /  / /_/ / __/ / / /_/ / |/ |/ / 
/___/_/ /_/|___/\___/_/ /_/\__/\____/_/   \__, /_/   /_/\____/|__/|__/  
                                         /____/                         
        `}
      </pre>
    </div>
  );
};

export default Home;
