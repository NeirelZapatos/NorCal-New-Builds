import React from "react";

function CardHeader(props) {
    return (
        <div>
            <h4 className="mb-2">{
                props.community
                .toLowerCase()
                .split(" ")
                .map(word => {
                        return word === "at" ? word :
                               word === "by" ? word :
                               word === "@" ? "at" :
                               word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(" ")
            }</h4>
            <h6 className="text-body-secondary">{props.city.charAt(0).toUpperCase() + props.city.slice(1)}, CA | Priced at ${props.price.toLocaleString()}</h6>
            <hr />
        </div>
    );
}

export default CardHeader;