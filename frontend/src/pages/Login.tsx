import { useState } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";


export default function Login() {

   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")

  return (
    <div className="bg-blk_1 min-h-screen">
        <Field
          label="Correo electrónico"
          hint="Introduce tu email registrado"
          type="email"
          variant="dark"
          value={email}
          onChange={(e) => {setEmail(e.target.value)}}
        />
        <Field
          label="Contraseña"
          hint="Pon tu contraseña segura"
          type="password"
          variant="dark"
          value={password}
          onChange={(e) => {setPassword(e.target.value)}}
        />
        <Button 
          label="Iniciar sesión"
          variant="primary"
          onClick={() => {
            // Aquí iría la lógica de autenticación
            console.log("Email:", email)
            console.log("Password:", password)
          }}/>
    </div>
  );
}
