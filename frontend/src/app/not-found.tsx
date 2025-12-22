import Image from "next/image";

export default function NotFound() {
  return (
    <main>
        <div className="flex items-center justify-center mr-35 mt-15">
            <Image
            
            src="/lightNotFoundLogo.svg"
            alt="MedLocator Logo"
            width={350}
            height={38}
            priority
        />
        </div>
        <h1 className="flex items-center justify-center font-bold text-5xl text-on-surface"><span className="text-primary"> 404 </span> | This page could not be found.</h1>
    </main>
  );
}
