// ⚠️ DEPRECATED TOOL
// This migration tool is no longer needed.
// The savedMovieIds migration was completed in Phase 1.
// The migration script (migrateSavedMovies.js) has been removed.

const MigrationHelper = () => {
  return (
    <div style={{ 
      padding: "40px", 
      color: "#fff", 
      background: "#141414", 
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        ⚠️ Migration Helper - Deprecated
      </h1>
      
      <div style={{ 
        background: "#222", 
        padding: "20px", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <p style={{ marginBottom: "10px" }}>
          ✅ This tool is no longer available.
        </p>
        <p style={{ marginBottom: "10px" }}>
          The savedMovieIds migration was completed in Phase 1 and the migration script has been removed.
        </p>
        <p>
          All profiles now have proper savedMovieIds arrays in Firestore.
        </p>
      </div>

      <div style={{ marginTop: "30px" }}>
        <a 
          href="/" 
          style={{ 
            color: "#e50914", 
            textDecoration: "none",
            fontSize: "18px"
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
};

export default MigrationHelper;
