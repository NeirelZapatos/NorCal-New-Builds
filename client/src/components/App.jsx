import { useState, useEffect } from 'react'
import axios from "axios";

const serverPort = 3000;

function App() {
  	const [count, setCount] = useState(0)
  	const [array, setArray] = useState([]);

  	const fetchAPI = async () => {
		try {
			const response = await axios.get(`http://localhost:${serverPort}/`);
			setArray(response.data.houses);
		} catch (err) {
			console.log(err);
		}
  	};

  	useEffect(() => {
    	fetchAPI();
  	}, []);

  	return (
    	<div>
			<button type="button" className="btn btn-primary">Base class</button>
			{array.map((house, index) => 
				<div key={index}>
					<p>{house.address}</p>
				</div>
			)}
    	</div>
  	)
}

export default App
