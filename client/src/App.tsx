

function App() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold text-netflix-red">NETFLIX</h1>
      <p className="text-xl text-gray-400">Clone Project Setup Complete</p>

      {/* Test nút bấm chuẩn style Netflix */}
      <button className="px-6 py-2 bg-netflix-red text-white font-medium rounded hover:bg-netflix-redHover transition-colors duration-300">
        Sign In
      </button>
    </div>
  );
}

export default App;
