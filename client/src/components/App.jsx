import { useState, useEffect } from 'react'
import axios from "axios";
import Header from "./Header";
import Information from "./Information";
import CardSection from "./CardSection";

const serverPort = 3000;

function App() {
  	const [houses, setHouses] = useState([]);

  	const fetchAPI = async () => {
		try {
			const response = await axios.get(`http://localhost:${serverPort}/`);
			setHouses(response.data.houses);
		} catch (err) {
			console.log(err);
		}
  	};

  	useEffect(() => {
    	fetchAPI();
  	}, []);

  	return (
    	<div>
			<Header />
			<Information />
			<CardSection houses={houses} />
    	</div>
  	)
}

export default App
