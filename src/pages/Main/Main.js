import React from 'react'
import "./Main.css"
import Navbar from '../../components/Navbar/Navbar'
import Button from '../../components/Button/Button'
import { Navigate, useNavigate } from 'react-router'

function Main({body}) {

  const navigate = useNavigate();

  const secciones = [
    <Button name={"Planificador de Procesos"} color='primary' onClick={() => navigate("/planificador-procesos")} />
  ]

  return (
    <div className='main-container'>
      <div className='main-container--navbar'>
        <Navbar secciones={secciones} />
      </div>
      <div className='main-container--body'>
        {body}
      </div>
    </div>
  )
}

export default Main