import React from "react";
import Card from "./Card";

function CardSection(props) {
    return (
        <div className="album py-5 bg-body-tertiary">
            <div className="container">
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                    {props.houses.map((house, index) => {
                        return (
                            <Card 
                                key={index}
                                house={house}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default CardSection;