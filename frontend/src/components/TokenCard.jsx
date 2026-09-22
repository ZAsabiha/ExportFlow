import React from "react";
import {
    Download,
    CheckCircle
} from "lucide-react";
import "./TokenCard.css"

export default function TokenCard(){


    return(

        <div className="token-card">


            <CheckCircle
                className="success-icon"
            />



            <h2>

                Order Completed

            </h2>


            <p>

                Token Generated Successfully

            </p>



            <div className="token-code">


                EXP-A8F92K-2026


            </div>



            <button className="primary-action">


                <Download size={18}/>

                Download Token PDF


            </button>



        </div>

    )

}