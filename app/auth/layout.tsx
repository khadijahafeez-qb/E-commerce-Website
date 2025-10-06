
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className=' flex items-center justify-center  min-h-screen bg-gray-100 '>
      <div className=' w-full  max-w-[608px]  '> 
        {children}
      </div> 
    </div>
 
  );
}
