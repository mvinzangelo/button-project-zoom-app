import { React, useEffect, useState, useRef } from 'react';
import { Route } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import io from 'socket.io-client'
import "./StudentView.css";


export const StudentView = (props) => {

    const buttonTimeout = 2000; // button is disabled for 2 seconds

    const {
        user,
        history,
        location,
        meetingUUID,
        socket
    } = props

    const [lectureCode, setLectureCode] = useState('');
    const [buttonResponseText, setbuttonResponseText] = useState('');
    const [textClass, setTextClass] = useState("text-primary");
    const [isTextVisible, setIsTextVisible] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('');
    const lectureCodeRef = useRef('');
    lectureCodeRef.current = lectureCode;

    useEffect(() => {
        setConnectionStatus('Looking for a room');
        // TODO: test if this still works with the user condition
        if (user) {
            var data = {
                "studentId": user.id,
                "meetingUUID": meetingUUID,
            }
            socket.emit('check_existing_lecture', data, (res) => {
                if (res) {
                    console.log("FOUND ROOM");
                }
                else {
                    console.log("NO ROOM FOUND");
                    setConnectionStatus('No room found, waiting for cloud recording to start');
                }
            })
        }
        socket.on('new_lecture_started', (data) => {
            if (user) {
                // to match the schema of the "join_lecture" event
                let code = data;
                socket.emit('join_lecture', { studentId, code });
                setLectureCode(data);
                history.push("/student/in-lecture");
            }
        })
    }, [])

    function handleCloudRecordingEvent(event) {
        console.log(event);
        if (event === 'connecting' && !lectureCodeRef.current) {
            console.log("CONNECTING");
        }
        else if (event === 'started' && !lectureCodeRef.current) {
            console.log("CREATED NEW LECTURE");
        }
        else if (event === 'started' && lectureCodeRef.current) {
            setIsTextVisible(false);
            setIsButtonDisabled(false);
            console.log("RESUMED");
        }
        else if (event === 'paused' && lectureCodeRef.current) {
            setIsTextVisible(true);
            setIsButtonDisabled(true);
            setbuttonResponseText("Recording is paused.");
            setTextClass("text-warning");
            console.log("PAUSED");
        }
        else if (event === 'stopped' && lectureCodeRef.current) {
            console.log("STOPPED");
            if (user.id !== '') {
                let studentId = user.id;
                socket.emit('leave_lecture', studentId);
                setLectureCode('');
                history.push("/student/enter-code");
            }
            else {
                console.error("No user.");
            }
        }
        else {
            console.log("NOTHING");
        }
    }

    useEffect(() => {
        zoomSdk.onCloudRecording((data) => {
            handleCloudRecordingEvent(data.action);
        })
    }, [user])

    const joinLectureButtonPress = () => {
        if (lectureCode !== '' && user.id !== '') {
            let studentId = user.id;
            let code = lectureCode;
            socket.emit('join_lecture', { studentId, code });
            history.push("/student/in-lecture");
        }
        else {
            console.error("No user or not in lecture.");
        }
    }

    const leaveLectureButtonPress = () => {
        if (user.id !== '') {
            let studentId = user.id;
            socket.emit('leave_lecture', studentId);
            setLectureCode('');
            history.push("/student/enter-code");
        }
        else {
            console.error("No user.");
        }
    }

    async function setButtonResposneText(response) {
        setIsTextVisible(true);
        setIsButtonDisabled(true);
        if (response) {
            setbuttonResponseText("Button press successfully recorded!");
            setTextClass("text-success");
        }
        else {
            setbuttonResponseText("Error: there was a problem recording the button press.");
            setTextClass("text-danger");
        }
        setTimeout(() => {
            setIsTextVisible(false);
            setIsButtonDisabled(false);
        }, buttonTimeout);
    }

    const confusionButtonPress = async () => {
        console.log("=========Confusion button pressed=========");
        var data = {
            "studentId": user.id,
            // ! should be refactored to be stored in the backend
            "lectureId": lectureCode
        }
        socket.emit('button_press', data, (isSuccess) => {
            setButtonResposneText(isSuccess);
        });
    };

    return (
        <div className="student-view-container">
            <Route path='/student/enter-code' exact>
                <Form>
                    <Form.Group className="mb-3" controlId="fromRoomCode">
                        <Form.Label>Room code</Form.Label>
                        <Form.Control placeholder="Enter room code"
                            value={lectureCode}
                            onChange={(e) => { setLectureCode(e.target.value) }}
                            type="text"
                        />
                        <Button onClick={joinLectureButtonPress}>Join lecture</Button>
                    </Form.Group>
                </Form>
                {/* <h2>{connectionStatus}</h2> */}
            </Route>
            <Route path='/student/in-lecture' exact>
                <div className="confusion-button-container">
                    <Button disabled={isButtonDisabled} onClick={confusionButtonPress}>Press me if you're confused</Button>
                </div>
                {isTextVisible && <div className="response-text-container">
                    <small className={textClass}>{buttonResponseText}</small>
                </div>}
                <div>
                    <Button onClick={leaveLectureButtonPress}>Leave lecture</Button>
                </div>
            </Route>
        </div>
    )
}