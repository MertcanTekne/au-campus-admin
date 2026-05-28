import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AcademicDashboardStats,
  AdminUser,
  AuthorInfo,
  CampusClass,
  ClassAnnouncement,
  ClassDetail,
  ClassMaterial,
  CreateClassInput,
  DashboardStats,
  PanelUser,
  UserRole,
} from "@/types/admin";

const USER_READ_LIMIT = 250;
const CLASS_READ_LIMIT = 250;
const SUBCOLLECTION_READ_LIMIT = 100;

export function getFirestoreErrorMessage() {
  return "Firestore verisi okunurken bir hata oluştu. Lütfen bağlantınızı ve yetkilerinizi kontrol edin.";
}

export function getFirestoreWriteErrorMessage() {
  return "İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.";
}

export function formatDate(value: unknown) {
  if (!value) return "-";

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value.toDate());
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    }
  }

  return "-";
}

function readString(data: Record<string, unknown>, key: string) {
  return typeof data[key] === "string" ? data[key] : undefined;
}

function mapUserDocument(id: string, data: Record<string, unknown>): AdminUser {
  return {
    uid: id,
    email: readString(data, "email") || "",
    displayName: readString(data, "displayName"),
    name: readString(data, "name"),
    role: readString(data, "role"),
    createdAt: data.createdAt,
  };
}

function mapClassDocument(id: string, data: Record<string, unknown>): CampusClass {
  return {
    id,
    className: readString(data, "className"),
    courseCode: readString(data, "courseCode"),
    section: readString(data, "section"),
    term: readString(data, "term"),
    description: readString(data, "description"),
    instructorUid: readString(data, "instructorUid"),
    instructorEmail: readString(data, "instructorEmail"),
    joinCode: readString(data, "joinCode"),
    isActive: typeof data.isActive === "boolean" ? data.isActive : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function mergeClasses(primary: CampusClass[], secondary: CampusClass[]) {
  const merged = new Map<string, CampusClass>();
  [...primary, ...secondary].forEach((campusClass) => merged.set(campusClass.id, campusClass));
  return [...merged.values()];
}

export function canManageClass(panelUser: PanelUser, campusClass: CampusClass) {
  if (panelUser.role === "admin") return true;
  return (
    campusClass.instructorUid === panelUser.uid ||
    (!!panelUser.email && campusClass.instructorEmail === panelUser.email)
  );
}

export async function fetchUsers(readLimit = USER_READ_LIMIT) {
  const snapshot = await getDocs(query(collection(db, "users"), limit(readLimit)));
  return snapshot.docs.map((userDoc) =>
    mapUserDocument(userDoc.id, userDoc.data() as Record<string, unknown>),
  );
}

export async function fetchAcademicUsers() {
  const academicQuery = query(
    collection(db, "users"),
    where("role", "==", "academic"),
    limit(USER_READ_LIMIT),
  );
  const snapshot = await getDocs(academicQuery);
  return snapshot.docs.map((userDoc) =>
    mapUserDocument(userDoc.id, userDoc.data() as Record<string, unknown>),
  );
}

export async function fetchPendingAcademicUsers() {
  const pendingQuery = query(
    collection(db, "users"),
    where("role", "==", "academic_pending"),
    limit(USER_READ_LIMIT),
  );
  const snapshot = await getDocs(pendingQuery);
  return snapshot.docs.map((userDoc) =>
    mapUserDocument(userDoc.id, userDoc.data() as Record<string, unknown>),
  );
}

export async function updateUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function fetchClasses(readLimit = CLASS_READ_LIMIT) {
  const snapshot = await getDocs(query(collection(db, "classes"), limit(readLimit)));
  return snapshot.docs.map((classDoc) =>
    mapClassDocument(classDoc.id, classDoc.data() as Record<string, unknown>),
  );
}

export async function fetchClassesForPanel(panelUser: PanelUser) {
  if (panelUser.role === "admin") {
    return fetchClasses();
  }

  const uidSnapshot = await getDocs(
    query(
      collection(db, "classes"),
      where("instructorUid", "==", panelUser.uid),
      limit(CLASS_READ_LIMIT),
    ),
  );
  const uidClasses = uidSnapshot.docs.map((classDoc) =>
    mapClassDocument(classDoc.id, classDoc.data() as Record<string, unknown>),
  );

  if (!panelUser.email) {
    return uidClasses;
  }

  const emailSnapshot = await getDocs(
    query(
      collection(db, "classes"),
      where("instructorEmail", "==", panelUser.email),
      limit(CLASS_READ_LIMIT),
    ),
  );
  const emailClasses = emailSnapshot.docs.map((classDoc) =>
    mapClassDocument(classDoc.id, classDoc.data() as Record<string, unknown>),
  );

  return mergeClasses(uidClasses, emailClasses);
}

export async function createClass(input: CreateClassInput) {
  const docRef = await addDoc(collection(db, "classes"), {
    ...input,
    joinCode: generateJoinCode(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClassActiveState(classId: string, isActive: boolean) {
  await updateDoc(doc(db, "classes", classId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [users, classes] = await Promise.all([fetchUsers(500), fetchClasses(500)]);
  return {
    totalUsers: users.length,
    studentCount: users.filter((user) => user.role === "student").length,
    academicCount: users.filter((user) => user.role === "academic").length,
    pendingAcademicCount: users.filter((user) => user.role === "academic_pending").length,
    adminCount: users.filter((user) => user.role === "admin").length,
    totalClasses: classes.length,
  };
}

export async function fetchAcademicDashboardStats(
  panelUser: PanelUser,
): Promise<AcademicDashboardStats> {
  const classes = await fetchClassesForPanel(panelUser);
  const details = await Promise.all(classes.map((campusClass) => fetchClassDetail(campusClass.id)));

  return {
    ownClassCount: classes.length,
    activeClassCount: classes.filter((campusClass) => campusClass.isActive).length,
    totalAnnouncementCount: details.reduce(
      (total, detail) => total + detail.announcements.length,
      0,
    ),
    totalMaterialCount: details.reduce((total, detail) => total + detail.materials.length, 0),
  };
}

export async function fetchClassDetail(classId: string): Promise<ClassDetail> {
  const [announcementsSnapshot, materialsSnapshot, membersSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "classes", classId, "announcements"),
        limit(SUBCOLLECTION_READ_LIMIT),
      ),
    ),
    getDocs(
      query(collection(db, "classes", classId, "materials"), limit(SUBCOLLECTION_READ_LIMIT)),
    ),
    getDocs(query(collection(db, "classes", classId, "members"), limit(500))),
  ]);

  return {
    announcements: announcementsSnapshot.docs.map((announcementDoc) => {
      const data = announcementDoc.data() as Record<string, unknown>;
      return {
        id: announcementDoc.id,
        title: readString(data, "title"),
        content: readString(data, "content"),
        authorUid: readString(data, "authorUid"),
        authorEmail: readString(data, "authorEmail"),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } satisfies ClassAnnouncement;
    }),
    materials: materialsSnapshot.docs.map((materialDoc) => {
      const data = materialDoc.data() as Record<string, unknown>;
      return {
        id: materialDoc.id,
        title: readString(data, "title"),
        type: readString(data, "type"),
        content: readString(data, "content"),
        url: readString(data, "url"),
        authorUid: readString(data, "authorUid"),
        authorEmail: readString(data, "authorEmail"),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } satisfies ClassMaterial;
    }),
    memberCount: membersSnapshot.size,
  };
}

export async function addAnnouncement(
  classId: string,
  input: { title: string; content: string } & AuthorInfo,
) {
  const docRef = await addDoc(collection(db, "classes", classId, "announcements"), {
    title: input.title,
    content: input.content,
    authorUid: input.authorUid,
    authorEmail: input.authorEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "classes", classId, "announcements", docRef.id), { id: docRef.id });
}

export async function addMaterial(
  classId: string,
  input: {
    title: string;
    type: "text" | "link";
    content: string;
    url: string;
  } & AuthorInfo,
) {
  const docRef = await addDoc(collection(db, "classes", classId, "materials"), {
    title: input.title,
    type: input.type,
    content: input.content,
    url: input.url,
    authorUid: input.authorUid,
    authorEmail: input.authorEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "classes", classId, "materials", docRef.id), { id: docRef.id });
}

export async function deleteAnnouncement(classId: string, announcementId: string) {
  await deleteDoc(doc(db, "classes", classId, "announcements", announcementId));
}

export async function deleteMaterial(classId: string, materialId: string) {
  await deleteDoc(doc(db, "classes", classId, "materials", materialId));
}
