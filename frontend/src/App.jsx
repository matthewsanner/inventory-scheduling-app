// import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Items from "./pages/Items";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route
            path="/"
            element={<h1 className="text-2xl font-bold">Home</h1>}
          />
          <Route path="/items" element={<Items />} />
        </Routes>
      </div>
    </Router>
  );
}

// function App() {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const response = await fetch(`${import.meta.env.VITE_API_URL}items`);
//         if (!response.ok) {
//           throw new Error("Network response was not ok");
//         }
//         const result = await response.json();
//         setData(result);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }

//     fetchData();
//   }, []);

//   return (
//     <div>
//       <h1>Item List</h1>
//       <ul>
//         {data.map((item) => (
//           <li key={item.name}>
//             <strong>{item.name}</strong>: {item.description} (Quantity:{" "}
//             {item.quantity})
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

export default App;
