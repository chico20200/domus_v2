import { useState } from "react";
import { Button } from "../components/Button";
import { Field } from "../components/Field";


export default function Register() {

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

  return (
    <div className="bg-blk_1 min-h-screen">
        <div className="flex items-center justify-center ">
            <img src="/logo_domus.png" alt="Logo de Domus" className="w-32 m-5"/>   
            <h1 className="text-4xl font-bold text-secondary_wt">Domus</h1>
        </div>
        <form className="max-w-md mx-auto mt-5 p-6 bg-blk_2 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-secondary_wt">Crear Cuenta</h2>   
            <Field
                label="Nombre completo"
                hint="Introduce tu nombre completo"
                placeholder="Juan Pérez"
                type="text"
                variant="dark"
                value={name}
                onChange={(e) => {setName(e.target.value)}}
            />
            <Field
                label="Correo electrónico"
                hint="Introduce tu email registrado"
                placeholder="correo@correo.com"
                type="email"
                variant="dark"
                value={email}
                onChange={(e) => {setEmail(e.target.value)}}
            />
            <Field
                label="Contraseña"
                placeholder="•••••••••"
                hint="Pon tu contraseña segura"
                type="password"
                variant="dark"
                value={password}
                onChange={(e) => {setPassword(e.target.value)}}
            />
            <Field
                label="Confirmar contraseña"
                placeholder="•••••••••"
                hint="Confirma tu contraseña"
                type="password"
                variant="dark"
                value={confirmPassword}
                onChange={(e) => {setConfirmPassword(e.target.value)}}
            />
            <Button
                label="Registrarse"
                variant="primary"
                onClick={() => {
                    // Aquí iría la lógica de registro
                    console.log("Name:", name)
                    console.log("Email:", email)
                    console.log("Password:", password)
                    console.log("Confirm Password:", confirmPassword)
                }}
            />
        </form>
        <p className="pb-5 text-center text-gray-500 mt-4">¿Ya tienes una cuenta? <a href="/" className="text-secondary_g hover:underline">Inicia sesión</a></p>
    </div>
  );
}
