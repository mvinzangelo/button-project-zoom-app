import { React, useState } from 'react';
import Button from "react-bootstrap/Button";
import "./ConfusionButton.css";

export const ConfusionButton = (props) => {

    const {
        user
    } = props

    const confusionButtonPress = async () => {
        console.log("=========Confusion button pressed=========");
        var data = {
          "user": user.first_name,
        }
        fetch('/api/postgres/onbuttonpress', {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        }).then(() =>{
            console.log("Button press updated correctly.")
        }).catch(e => {
            console.error(e);
        });
    };
    return (
        <div className="confusion-button">
            <Button onClick={confusionButtonPress}>Press me if you're confused</Button>
        </div>
    )
}