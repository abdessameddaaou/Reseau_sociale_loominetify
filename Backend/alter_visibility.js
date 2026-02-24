const db = require("./db/db");

async function addVisibilityColumn() {
    try {
        await db.query("ALTER TABLE Publications ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public';");
        console.log("Column 'visibility' added successfully to Publications table.");
    } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'visibility' already exists.");
        } else {
            console.error("Error adding column:", error);
        }
    } finally {
        process.exit();
    }
}

addVisibilityColumn();
