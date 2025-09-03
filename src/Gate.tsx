import React, { useState } from 'react'
import Splash from './Splash'
import App from './App'
export default function Gate(){const[entered,setEntered]=useState(false);if(!entered)return <Splash onEnter={()=>setEntered(true)}/>;return <App/>}
