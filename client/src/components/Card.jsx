import React from "react";
import CardHeader from "./CardHeader";

function Card(props) {
    return (
        <div className="col">
            <div className="card shadow-sm">
                <img src={props.house.imgurl} alt="house image" />
                <div className="card-body">
                    <div className="card-text">
                        <CardHeader 
                            community={props.house.community}
                            city={props.house.city}
                            price={props.house.price}
                         />

                        <div className="col-lg-12 d-flex">
                            <div className="col-lg-3 d-flex flex-column align-items-center border-end">
                                <strong className="text-body-secondary">{props.house.sqft.toLocaleString()}</strong>
                                <p className="text-body-secondary details">SQ. FT.</p>
                            </div>
                            <div className="col-lg-3 d-flex flex-column align-items-center border-end">
                                <strong className="text-body-secondary">{props.house.beds}</strong>
                                <p className="text-body-secondary details">BEDS</p>
                            </div>
                            <div className="col-lg-3 d-flex flex-column align-items-center border-end">
                                <strong className="text-body-secondary">{props.house.baths}</strong>
                                <p className="text-body-secondary details">BATHS</p>
                            </div>
                            <div className="col-lg-3 d-flex flex-column align-items-center">
                                <strong className="text-body-secondary">{props.house.garages}</strong>
                                <p className="text-body-secondary details">BAY GARAGE</p>
                            </div>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                            <button type="button" className="btn btn-primary btn-md w-100 mt-2">View Details</button>
                        </div>
                        <small className="text-body-secondary">{props.house.builder}</small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Card;