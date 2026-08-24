const r1 = db.users.deleteMany({ email: "testlearner@example.com" });
const r2 = db.courses.deleteMany({ name: "QA Testing Course" });
print("cleaned users: " + r1.deletedCount + ", courses: " + r2.deletedCount);
