const collections = [
  "admins", "users", "courses", "programs", "projects", "enrollments",
  "orders", "inquiries", "blog", "testimonials", "mentors",
  "notifications", "settings", "audit_logs", "activities"
];
collections.forEach((c) => {
  const n = db.getCollection(c).countDocuments({});
  print(c.padEnd(14) + ": " + n);
});
print("---");
print("sample course: " + JSON.stringify(db.courses.findOne({}, { name: 1, category: 1, status: 1, amount: 1 })));
print("latest audit : " + JSON.stringify(db.audit_logs.find().sort({ createdAt: -1 }).limit(1).toArray()[0], null, 0).substring(0, 220));
