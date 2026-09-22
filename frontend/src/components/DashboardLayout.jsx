import React from "react";


import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";


import "./dashboard.css";



export default function DashboardLayout({children}){


    return(

        <div className="dashboard-layout">


            <Sidebar/>


            <div className="dashboard-main">


                <TopNavbar/>



                <main className="dashboard-content">


                    {children}


                </main>


            </div>


        </div>

    )

}