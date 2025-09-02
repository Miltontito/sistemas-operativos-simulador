import React from 'react'
import "./Navbar.css"

function Navbar({ secciones }) {
  return (
    <div className='navbar'>
      {secciones}
    </div>
  )
}

export default Navbar;