import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout/Layout.jsx"; 
import Signup from "./components/Auth/Signup.jsx";
import Login from "./components/Auth/Login.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import AnonymousForum from "./components/AnonymousForum/AnonymousForum.jsx";
import Protected from "./components/Auth/Protected.jsx"
import Home from "./components/Home/Home.jsx";
import MentorSearchPage from "./components/mentor/MentorSearchPage.jsx";
import MentorProfile from "./components/mentor/MentorProfile.jsx";
import UserProfile from "./components/UserProfile/ProfileCard.jsx";
import MentorDashboard from "./components/mentor/MentorDashboard.jsx";
import EmployerDashboard from "./components/Employer/EmployerDashboard.jsx";
import CollegeDashboard from "./components/College/CollegeDashboard.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      //Add Protected Routes
      {
        path:"/admindashboard",
        element: 
          // <Protected>
            <AdminDashboard/>
            // </Protected>,
      },
      {
        path:"/anonymousforum",
        element:
          // <Protected>
        <AnonymousForum/>,
        // </Protected>,
      },
      {
        path:"/mentors",
        element:<MentorSearchPage/>
      },
      {
        path:"/mentor-profile/:id",
        element:<MentorProfile/>
      },
      {
        path:"/profile",
        element:<UserProfile/>  
      },
      {
        path:"/mentordashboard",
        element:<MentorDashboard/>
      },
      {
        path:"/employerdashboard",
        element:<EmployerDashboard/>
      },
      {
        path:"/collegedashboard",
        element:<CollegeDashboard/>
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
