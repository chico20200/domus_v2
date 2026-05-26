import {Field} from "../components/Field";
import { Button } from "../components/Button";
import { useState } from "react";

export default function RecoveryPassword() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    return (
        <div className="bg-blk_1 min-h-screen">
            <div className="flex items-center justify-center ">
                <img src="/logo_domus.png" alt="Logo de Domus" className="w-32 m-5"/>
                <h1 className="text-4xl font-bold text-secondary_wt">Domus</h1>
            </div>
            <form className="max-w-md mx-auto mt-20 p-6 bg-blk_2 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-secondary_wt">Recuperar Contraseña</h2>
                <Field
                    label="Introduce tu nueva contraseña"
                    hint="La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número."
                    placeholder="•••••••••"
                    type="password"
                    variant="dark"
                    value={password}
                    onChange={(e) => {setPassword(e.target.value)}}
                />
                <Field
                    label="Confirma tu nueva contraseña"
                    hint="Introduce tu nueva contraseña otravez"
                    placeholder="•••••••••"
                    type="password"
                    variant="dark"
                    value={confirmPassword}
                    onChange={(e) => {setConfirmPassword(e.target.value)}}
                />
                    
                <Button
                    label="Recuperar Contraseña"
                    variant="primary"
                    onClick={() => {
                        // Aquí iría la lógica de recuperación de contraseña
                    }}
                />
            </form>
        </div>
    );
}
