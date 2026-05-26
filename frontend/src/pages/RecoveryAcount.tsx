import { useState } from "react";
import { Field } from "../components/Field";
import { Button } from "../components/Button";

export default function RecoveryAccount() {

    const [email, setEmail] = useState("")
    return (
        <div className="bg-blk_1 min-h-screen">
            <div className="flex items-center justify-center ">
                <img src="/logo_domus.png" alt="Logo de Domus" className="w-32 m-5"/>
                <h1 className="text-4xl font-bold text-secondary_wt">Domus</h1>
            </div>
            <form className="max-w-md mx-auto mt-20 p-6 bg-blk_2 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-secondary_wt">Recuperar Cuenta</h2>
                <Field
                    label="Correo electrónico"
                    hint="Introduce tu email registrado para recuperar tu cuenta"
                    placeholder="correo@correo.com"
                    type="email"
                    variant="dark"
                    value={email}
                    onChange={(e) => {setEmail(e.target.value)}}
                />
                <Button
                    label="Recuperar Cuenta"
                    variant="primary"
                    onClick={() => {
                        // Aquí iría la lógica de recuperación de cuenta
                        console.log("Email:", email)
                    }}
                />
            </form>
        </div>
    )
}