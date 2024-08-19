import { useState, useEffect } from 'react'
import axios from "axios";

function App() {
  const [count, setCount] = useState(0)
  const [array, setArray] = useState([]);

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:8080/api");
    setArray(response.data.fruits);
    console.log(response.data.fruits);
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  return (
    <div>
      {array.map((fruit, index) => 
        <div key={index}>
          <p>{fruit}</p>
        </div>
      )}
    </div>
  )
}

export default App
