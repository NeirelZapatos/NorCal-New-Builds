import React from "react";

function Card(props) {
    return (
        <div className="col">
            <div className="card shadow-sm">
                <img src={props.house.imgurl} alt="house image" />
                <div className="card-body">
                    <p className="card-text">City: {props.house.city}</p>
                    <p className="card-text">Community: {props.house.community}</p>
                    <p className="card-text">Price: ${props.house.price.toLocaleString()}</p>
                    <p className="card-text">Square feet: {props.house.sqft.toLocaleString()}</p>
                    <p className="card-text">Beds: {props.house.beds}</p>
                    <p className="card-text">Baths: {props.house.baths}</p>
                    <p className="card-text">Garage space: {props.house.garages}</p>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-outline-secondary">View</button>
                            <button type="button" className="btn btn-sm btn-outline-secondary">Edit</button>
                        </div>
                        <small className="text-body-secondary">9 mins</small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Card;