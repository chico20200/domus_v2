import { Button } from "../components/Button";
import { Field } from "../components/Field";


export default function Login() {


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Usuario:", name);
  };

  return (
    <div className="w-full flex flex-row bg-blk_1">
        <div className="min-h-screen flex items-center justify-center px-4 w-1/2 ">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-blk_2 rounded-2xl p-8 flex flex-col gap-6 shadow-md"
        >
            <div className="text-center">
                <div className="flex m-10" >
                    <img  src="logo_domus.png" alt="" className="w-25"/>
                    <h1 className="text-3xl font-bold text-primary_y m-10">DOMUS</h1>
                </div>
                <div className="flex justify-between pl-10 pr-10">
                <Button type="submit">Registrarse</Button>
                <Button type="submit">Iniciar sesión</Button>
                </div>

            </div>

            <Field label = "Usuario" variant="dark"/>
            <Field label = "Contraseña" variant="dark" type="password"/>
            <Button type="submit">Ingresar</Button>
        </form>
        </div>
        <div className="w-1/2 h-full">   
            <img className= "h-full object-fit" src="fondo_hex.png" alt="" />
        </div>
    </div>
  );
}
