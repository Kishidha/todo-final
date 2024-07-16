import logo from './logo.svg';
import pic2 from './component/pic2.jpg';
import './App.css';
import TodoApp from './component/TodoApp';
import { Route, Routes, Navigate } from "react-router-dom";
import Main from "./components/Main";
import Signup from "./components/Singup";
import Login from "./components/Login";
import EmailVerify from "./components/EmailVerify";

function App() {
  const user = localStorage.getItem("token");
  return (
    <>
    <TodoApp/>
    <Routes>
			{user && <Route path="/" exact element={<Main />} />}
			<Route path="/signup" exact element={<Signup />} />
			<Route path="/login" exact element={<Login />} />
			<Route path="/" element={<Navigate replace to="/login" />} />
			<Route path="/users/:id/verify/:token" element={<EmailVerify />} />
		</Routes>
    </>
  );
}

export default App;
