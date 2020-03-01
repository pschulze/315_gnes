import React from 'react';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Nav from 'react-bootstrap/Nav';
import FormControl from 'react-bootstrap/FormControl';
import moment from 'moment';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Alert,
} from 'react-bootstrap';


import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  init,
  emitMessage,
  subscribeToStateUpdate,
  requestState,
  subscribeToErrors,
} from './api';

type User = {
  userId: string
  nickname: string
  nameColour: string
  active: boolean
};

type AppState = {
  userId: string
  messages: Array<MessageProps>
  users: Record<string, User>
  errorMessage?: string
};

type MessageProps = {
  timestamp: string
  nickname: string
  nicknameColour: string
  message: string
  currentUserMessage: boolean
  userId?: string
};

type MessageBoxProps = {
  messages: Array<MessageProps>;
};

type UsersBoxProps = {
  users: Array<User>
};

type ChatBoxProps = {
  userId: string
};

type AlertProps = {
  message: string,
};

class App extends React.Component<{}, AppState> {
  constructor(props) {
    super(props);
    subscribeToStateUpdate((newMessages, newUsers) => {
      this.updateStateFromServer(newMessages, newUsers);
    });
    subscribeToErrors((errorMessage: string) => this.receiveError(errorMessage));

    this.state = {
      userId: '',
      messages: [],
      users: {},
    };
  }

  componentDidMount() {
    axios.get('http://localhost:8000/init', { withCredentials: true })
      .then((res) => {
        this.setState({ userId: res.data.userId });
        init(res.data.userId);
        requestState();
      });
  }

  updateStateFromServer(newMessages, newUsers) {
    console.log(newUsers);
    this.setState({ users: newUsers });

    const messages: MessageProps[] = [];
    newMessages.forEach((m) => {
      const newMessage = this.buildMessage(m);
      if (newMessage === undefined) {
        console.log(`undefined message: ${m}`);
      } else {
        messages.push(newMessage);
      }
    });
    this.setState({ messages });
  }

  receiveMessage(message: MessageProps) {
    const { messages, userId } = this.state;
    if (messages.length === 200) {
      messages.pop();
    }
    const newMessage = this.buildMessage(message);
    if (newMessage === undefined) {
      console.log(`undefined message: ${message.message}`);
    } else {
      messages.push(newMessage);
      if (message.userId === userId) {
        this.clearError();
      }
    }
    this.setState({ messages });
  }

  receiveError(errorMessage: string) {
    this.setState({ errorMessage });
  }

  clearError() {
    this.setState({ errorMessage: undefined });
  }

  buildMessage(rawMessage): MessageProps | undefined {
    const { users, userId } = this.state;
    const timestamp = moment(rawMessage.timestamp).format('kk:mm');
    const user = users[rawMessage.userId];
    if (user === undefined) {
      return undefined;
    }

    const currentUserMessage = userId === rawMessage.userId;

    return ({
      timestamp,
      currentUserMessage,
      nickname: user.nickname,
      nicknameColour: user.nameColour,
      message: rawMessage.message,
    });
  }

  render() {
    const {
      userId,
      messages,
      users,
      errorMessage,
    } = this.state;

    const errorAlert = errorMessage ? <AlertDismissible message={errorMessage} /> : undefined;

    return (
      <div className="App d-flex flex-column">
        <Nav className="navbar navbar-light bg-light">
          <span className="navbar-brand mb-0 h1">MSN Messenger</span>
        </Nav>
        {errorAlert}
        <Container className="d-flex flex-grow-1">
          <UsersBox users={Object.values(users)} />
          <Col xs={9} className="chat d-flex flex-column flex-grow-1">
            <MessageBox messages={messages} />
            <p className="blocker" />
            <ChatBox userId={userId} />
          </Col>
        </Container>
      </div>
    );
  }
}

function Message(props: MessageProps) {
  const {
    timestamp, nickname, nicknameColour, message, currentUserMessage,
  } = props;

  const stylizedMessage = currentUserMessage ? <strong>{message}</strong> : message;

  return (
    <Container className="message flex-grow-0">
      <Row className="message-header">
        <Col className="nickname">
          <h5 style={{ color: `#${nicknameColour}` }}>{nickname}</h5>
        </Col>
        <Col className="timestamp text-right">
          <h6>{timestamp}</h6>
        </Col>
      </Row>
      <Row className="message-body">
        <Col className="message">

          <p>{stylizedMessage}</p>
        </Col>
      </Row>
    </Container>
  );
}

function MessageBox(props: MessageBoxProps) {
  const { messages } = props;
  const messageComponents: Array<JSX.Element> = [];

  const messagesEndRef = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    const node = messagesEndRef.current;
    if (node) {
      node.scrollIntoView({ behavior: 'smooth' });
    }
  });

  messages.forEach((message) => {
    messageComponents.push(
      <Message
        timestamp={message.timestamp}
        nickname={message.nickname}
        nicknameColour={message.nicknameColour}
        message={message.message}
        currentUserMessage={message.currentUserMessage}
      />,
    );
  });
  return (
    <Row className="message-box m-1 flex-column flex-nowrap flex-grow-1">
      {messageComponents}
      <div ref={messagesEndRef} />
    </Row>
  );
}

function UsersBox(props: UsersBoxProps) {
  const { users } = props;

  const userComponents: Array<JSX.Element> = [];
  users.forEach((user) => {
    if (user.active) {
      userComponents.push(
        <Container className="user flex-grow-0">
          <Row className="userRow flex-column flex-nowrap flex-grow-1">
            <h5 style={{ color: `#${user.nameColour}` }}>{user.nickname}</h5>
          </Row>
        </Container>,
      );
    }
  });
  return (
    <Col className="users d-flex flex-column flex-grow-1">
      <Row>
        <h4>Active Users</h4>
      </Row>
      <Row className="user-box flex-column flex-nowrap flex-grow-1">
        {userComponents}
      </Row>
    </Col>
  );
}

function ChatBox(props: ChatBoxProps) {
  const { userId } = props;
  const [input, setInput] = React.useState('');
  return (
    <Row className="chat-box align-items-end">
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Enter a message to send"
          aria-label="Chat Box"
          aria-describedby="basic-addon2"
          value={input}
          onInput={(e) => setInput(e.target.value)}
        />
        <InputGroup.Append>
          <Button
            variant="outline-primary"
            onClick={() => {
              emitMessage(userId, input);
              setInput('');
            }}
          >
            Send
          </Button>
        </InputGroup.Append>
      </InputGroup>
    </Row>
  );
}

function AlertDismissible(props: AlertProps) {
  const { message } = props;
  return (
    <Alert variant="danger">
      <Alert.Heading>Error</Alert.Heading>
      <p>
        {message}
      </p>
    </Alert>
  );
}

export default App;
