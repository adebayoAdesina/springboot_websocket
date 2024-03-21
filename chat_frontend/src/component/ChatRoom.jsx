import { useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";

var stompClient = null;
export const ChatRoom = () => {
  const [userData, setUserData] = useState({
    username: "",
    recievername: "",
    connected: false,
    message: "",
  });
  const [publicChat, setPublicChat] = useState([]);
  const [privateChat, setPrivateChat] = useState(new Map());

  const handleValue = (event) => {
    const { value, name } = event.target;

    setUserData({ ...userData, [name]: value });
  };

  const registerUser = () => {
    let sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessageReceived
    );
    userJoin();
  };

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    switch (payload.status) {
      case "JOIN":
        if (!privateChat.get(payloadData.senderName)) {
          privateChat.set(payloadData.senderName, []);
          setPrivateChat(new Map(privateChat));
        }
        break;
      case "Message":
        publicChat.push(payloadData);
        setPublicChat([...publicChat]);
        break;
      default:
        break;
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload);
    if (privateChat.get(payloadData.senderName)) {
      privateChat.get(payloadData.senderName).push(payloadData);
      setPrivateChat(new Map(privateChat));
    } else {
      let list = [];
      list.push(payloadData);
      privateChat.set(payloadData.senderName, list);
      setPrivateChat(new Map(privateChat));
    }
  };

  const [tab, setTab] = useState("CHATROOM");

  const sendPublicMessage = () => {
    if (stompClient) {
      let chatMessage = {
        recievername: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };

      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: tab,
        message: userData.message,
        status: "MESSAGE",
      };
      if (userData.username !== tab) {
        privateChat.set(tab).push(chatMessage);
        setPrivateChat(new Map(privateChat));
      }
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const userJoin = () => {
    if (stompClient) {
      let chatMessage = {
        recievername: userData.username,
        message: userData.message,
        status: "JOIN",
      };

      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }
  };
  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => setTab("CHATROOM")}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Chat room
              </li>
              {[...privateChat.keys()].map((name, index) => {
                <li
                  onClick={() => setTab(name)}
                  className={`member ${tab === name && "active"}`}
                  key={index}
                >
                  {name}
                </li>;
              })}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {publicChat.map((chat, index) => {
                  <li className="message" key={index}>
                    {chat.senderName !== userData.username && (
                      <div className="avater">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName !== userData.username && (
                      <div className="avater self">{chat.senderName}</div>
                    )}
                  </li>;
                })}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  name="message"
                  className="input-message"
                  placeholder="enter public message"
                  value={userData.message}
                  onChange={handleValue}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPublicMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-message">
                {[...privateChat.get(tab)].map((chat, index) => {
                  <li className="message" key={index}>
                    {chat.senderName !== userData.username && (
                      <div className="avater">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName !== userData.username && (
                      <div className="avater self">{chat.senderName}</div>
                    )}
                  </li>;
                })}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  name="message"
                  className="input-message"
                  placeholder={`enter private message ${tab}`}
                  value={userData.message}
                  onChange={handleValue}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            type="text"
            id="user-name"
            name="username"
            placeholder="Enter the username"
            value={userData.username}
            onChange={handleValue}
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};
