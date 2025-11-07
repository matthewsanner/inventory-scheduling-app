const Home = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "75vh",
      }}>
      <pre
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
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
