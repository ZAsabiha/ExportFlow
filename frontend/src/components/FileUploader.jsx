import React, {useState} from "react";
import {
    UploadCloud,
    FileText,
    X
} from "lucide-react";


export default function FileUploader(){


    const [files,setFiles]=useState([]);



    function handleFiles(e){

        const selected=[
            ...e.target.files
        ];

        setFiles([
            ...files,
            ...selected
        ]);

    }



    function removeFile(index){

        setFiles(
            files.filter(
                (_,i)=>i!==index
            )
        );

    }



    return(

        <div className="upload-box">


            <input

                type="file"

                multiple

                id="fileUpload"

                onChange={handleFiles}

            />



            <label htmlFor="fileUpload">


                <UploadCloud size={40}/>


                <h3>
                    Upload Documents
                </h3>


                <p>
                    Drag multiple files or click here
                </p>


            </label>





            <div className="file-list">


                {
                    files.map((file,index)=>(


                        <div className="file-item">


                            <FileText size={18}/>


                            <span>
{file.name}
</span>



                            <button

                                onClick={()=>
                                    removeFile(index)
                                }

                            >

                                <X size={16}/>

                            </button>


                        </div>


                    ))
                }



            </div>





            <button className="primary-action">


                Upload All Documents


            </button>



        </div>

    )

}