import { Fragment, useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  // --- NEW: GLOBAL LOADING STATE ---
  const [globalLoading, setGlobalLoading] = useState(true);

  // --- EXISTING STATES ---
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  
  const [selectedPortal, setSelectedPortal] = useState(() => {
    if (localStorage.getItem("adminToken")) return "admin";
    if (localStorage.getItem("token")) return "student";
    return "";
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  
  // FIXED: Sync Selected Subject & Topic to Session Storage so they survive page refresh
  const [selectedSubject, setSelectedSubject] = useState(sessionStorage.getItem("selectedSubject") || null);
  const [activeTopicTitle, setActiveTopicTitle] = useState(sessionStorage.getItem("activeTopicTitle") || "");
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem("activeTab") || "theory"); 

  const [password, setPassword] = useState("");
  const [adminId, setAdminId] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [interestedCourses, setInterestedCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [courses, setCourses] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [studentProfileForm, setStudentProfileForm] = useState({
    name: "", email: "", phone: "", dob: "", gender: "", password: "", image: "",
  });
  const [studentProfilePreview, setStudentProfilePreview] = useState("");
  const menuRef = useRef();

  // --- STUDENT WORKSPACE STATES ---
  const [activeTopicContent, setActiveTopicContent] = useState("");
  const [activeTopicPdfAllowed, setActiveTopicPdfAllowed] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);

  // --- DYNAMIC COURSE & THEORY STATES (ADMIN SIDE) ---
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCourse, setNewCategoryCourse] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCategory, setNewSubjectCategory] = useState("");
  const [newSubjectCourse, setNewSubjectCourse] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [newSubjectTopics, setNewSubjectTopics] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [selectedAdminSubject, setSelectedAdminSubject] = useState(null);
  const [selectedAdminTopic, setSelectedAdminTopic] = useState(null);
  const [rawTextContent, setRawTextContent] = useState("");
  const [allowPdfDownload, setAllowPdfDownload] = useState(false);

  // --- NEW STATES FOR ADMIN TEST CREATION FEATURE ---
  const [showTestForm, setShowTestForm] = useState(false);
  const [testTotalQuestions, setTestTotalQuestions] = useState(5);
  const [testOptionsPerQuestion, setTestOptionsPerQuestion] = useState(4);
  const [testDuration, setTestDuration] = useState(10);
  const [testDate, setTestDate] = useState("");
  const [testStartTime, setTestStartTime] = useState("");
  const [testQuestions, setTestQuestions] = useState([]);

  // --- NEW STATES FOR STUDENT PERFORMANCE ANALYTICS ---
  const [analyticsRecords, setAnalyticsRecords] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // --- TEST SESSION STATE / REFS ---
  const testFullscreenRef = useRef(null);
  const testEndedRef = useRef(false);
  const lastViolationAtRef = useRef(0);
  const [testSessionActive, setTestSessionActive] = useState(false);
  const [testSessionStatus, setTestSessionStatus] = useState("idle"); // idle | active | submitted
  const [testRemainingSeconds, setTestRemainingSeconds] = useState(0);
  const [testViolationCount, setTestViolationCount] = useState(0);
  const [testFullscreenExitCount, setTestFullscreenExitCount] = useState(0);
  const [testTabSwitchCount, setTestTabSwitchCount] = useState(0);
  const [testSessionStartedAt, setTestSessionStartedAt] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testWarningMessage, setTestWarningMessage] = useState("");
  const [testAttempted, setTestAttempted] = useState(false);

  const MAX_TEST_VIOLATIONS = 3;
  const currentSubjectObj = selectedSubject ? subjects.find((subject) => subject.name === selectedSubject) : null;
  const activeTopicObj = currentSubjectObj?.topics?.find((topic) => topic.title === activeTopicTitle);
  const currentTestAttemptKey = userId && currentSubjectObj ? `test_attempt_${userId}_${currentSubjectObj._id}` : "";

  // --- SYNC STATE TO SESSION STORAGE ON CHANGE ---
  useEffect(() => {
    if (selectedSubject) sessionStorage.setItem("selectedSubject", selectedSubject);
    else sessionStorage.removeItem("selectedSubject");
  }, [selectedSubject]);

  useEffect(() => {
    if (activeTopicTitle) sessionStorage.setItem("activeTopicTitle", activeTopicTitle);
    else sessionStorage.removeItem("activeTopicTitle");
  }, [activeTopicTitle]);

  useEffect(() => {
    if (activeTab) sessionStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!currentTestAttemptKey) {
      setTestAttempted(false);
      return;
    }
    setTestAttempted(localStorage.getItem(currentTestAttemptKey) === "1");
  }, [currentTestAttemptKey]);

  // --- TIMER EFFECT FOR STUDENT ---
  useEffect(() => {
    let interval = null;
    if (activeTopicTitle && isLoggedIn && !isAdminLoggedIn && activeTab === "theory") {
      interval = setInterval(() => {
        setStudySeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTopicTitle, isLoggedIn, isAdminLoggedIn, activeTab]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const normalizeText = (value) => value.trim().toLowerCase();

  const getSubjectTestTopic = (subject) => {
    if (!subject?.topics?.length) return null;
    return subject.topics.find((topic) => topic?.test?.hasTest) || subject.topics[0] || null;
  };

  const getSubjectTestConfig = (subject) => getSubjectTestTopic(subject)?.test || null;

  const applySubjectTestTopicState = (subject) => {
    const testTopic = getSubjectTestTopic(subject);
    if (!testTopic) return null;

    setSelectedAdminTopic(testTopic);
    setRawTextContent(testTopic.theoryText || "");
    setAllowPdfDownload(testTopic.allowPdfDownload || false);

    if (testTopic.test && testTopic.test.hasTest) {
      setTestTotalQuestions(testTopic.test.totalQuestions || 5);
      setTestOptionsPerQuestion(testTopic.test.optionsPerQuestion || 4);
      setTestDate(testTopic.test.testDate || "");
      setTestQuestions(
        Array.isArray(testTopic.test.questions)
          ? testTopic.test.questions.map((q) => ({
              questionText: q.questionText || "",
              marks: Number(q.marks) || 1,
              options: Array.isArray(q.options) ? q.options : [],
              correctOptionIndex: Number.isInteger(q.correctOptionIndex) ? q.correctOptionIndex : 0,
            }))
          : []
      );
    } else {
      setTestTotalQuestions(5);
      setTestOptionsPerQuestion(4);
      setTestDate("");
      setTestQuestions([]);
    }
    return testTopic;
  };

  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "object") return String(value._id || value.id || "");
    return String(value);
  };

  const getStudentSubjectProgress = (subject) => {
    const subjectId = normalizeId(subject?._id);
    const theoryProgress = progressData.find((item) => normalizeId(item.subjectId) === subjectId);
    const completedTopics = Array.isArray(theoryProgress?.completedTopics) ? theoryProgress.completedTopics : [];
    const subjectTestAttempted = Boolean(theoryProgress?.subjectTest?.attempted || theoryProgress?.tests?.length > 0);
    const totalUnits = (subject?.topics?.length || 0) + (subjectTestAttempted ? 1 : 0);
    const completedUnits = completedTopics.length + (subjectTestAttempted ? 1 : 0);

    return {
      progressPercentage: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
      completedTopics,
      theoryProgress,
      subjectTestAttempted,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FETCH DATA / SYNC ---
  const reloadSubjectsData = async (uid = userId, adminFlag = isAdminLoggedIn) => {
    try {
      const [subjectRes, courseRes, categoryRes] = await Promise.all([
        axios.get("http://localhost:5000/api/subjects"),
        axios.get("http://localhost:5000/api/subjects/courses"),
        axios.get("http://localhost:5000/api/categories")
      ]);

      setSubjects(subjectRes.data);
      setCourses(courseRes.data);
      setCategories(categoryRes.data);

      if (uid) {
        const progressRes = await axios.get(`http://localhost:5000/api/progress/${uid}`);
        setProgressData(progressRes.data);
      }

      if (adminFlag) {
        const analyticsRes = await axios.get("http://localhost:5000/api/subjects/admin/students-analytics");
        setAnalyticsRecords(analyticsRes.data);
      }
    } catch (err) {
      console.log("Error reloading data matrices", err);
    }
  };

  // --- INITIALIZATION & SESSION VALIDATION ---
  useEffect(() => {
    const initializeApp = async () => {
      setGlobalLoading(true);
      
      let verifiedUserId = null;
      let verifiedAdminFlag = false;

      const adminToken = localStorage.getItem("adminToken");
      const studentToken = localStorage.getItem("token");

      try {
        if (adminToken) {
          try {
            await axios.get("http://localhost:5000/api/admin/verify", {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            setIsAdminLoggedIn(true);
            setSelectedPortal("admin");
            verifiedAdminFlag = true;
          } catch (e) {
            console.error("Admin session invalid");
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUsername");
            localStorage.removeItem("role");
            setIsAdminLoggedIn(false);
          }
        } else if (studentToken) {
          try {
            const res = await axios.get("http://localhost:5000/api/users/verify", {
              headers: { Authorization: `Bearer ${studentToken}` }
            });
            
            const user = res.data.user;
            setUserId(user._id);
            setUsername(user.username);
            verifiedUserId = user._id;

            // Use fresh courses from DB, not stale localStorage
            const safeCourses = (user.interestedCourses || []).map(c => c._id || c);
            setStudentCourses(safeCourses);
            localStorage.setItem("studentCourses", JSON.stringify(safeCourses));
            
            setIsLoggedIn(true);
            setSelectedPortal("student");
          } catch (e) {
            console.error("Student session invalid");
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("username");
            localStorage.removeItem("studentCourses");
            setIsLoggedIn(false);
          }
        }

        // Fetch fresh app data once tokens are evaluated
        await reloadSubjectsData(verifiedUserId, verifiedAdminFlag);

        // Restore active topic text if restoring session
        if (sessionStorage.getItem("activeTopicTitle")) {
          const restoredTitle = sessionStorage.getItem("activeTopicTitle");
          // Re-fetch requires a tick to populate subjects
          setTimeout(() => {
            setSubjects((currentSubjects) => {
               const cSub = currentSubjects.find(s => s.name === sessionStorage.getItem("selectedSubject"));
               const cTopic = cSub?.topics?.find(t => t.title === restoredTitle);
               if (cTopic) {
                 setActiveTopicContent(cTopic.theoryText || "");
                 setActiveTopicPdfAllowed(cTopic.allowPdfDownload || false);
               }
               return currentSubjects;
            });
          }, 500);
        }

      } finally {
        setGlobalLoading(false);
      }
    };

    initializeApp();
  }, []);

  // BACKGROUND SYNC (Keep dashboard updated when returning to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn || isAdminLoggedIn) {
        reloadSubjectsData(userId, isAdminLoggedIn);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId, isLoggedIn, isAdminLoggedIn]);

  const getAuditStoreKey = (studentId) => `lms_audit_${studentId}`;
  const readStudentAuditStore = (studentId) => {
    if (!studentId) return {};
    try { return JSON.parse(localStorage.getItem(getAuditStoreKey(studentId)) || "{}"); } catch (error) { return {}; }
  };
  const writeStudentAuditStore = (studentId, updater) => {
    if (!studentId) return {};
    const current = readStudentAuditStore(studentId);
    const workingCopy = JSON.parse(JSON.stringify(current || {}));
    const nextStore = typeof updater === "function" ? updater(workingCopy) || workingCopy : updater || workingCopy;
    localStorage.setItem(getAuditStoreKey(studentId), JSON.stringify(nextStore));
    return nextStore;
  };

  const upsertSubjectAudit = ({ studentId, subject, updater }) => {
    const subjectKey = normalizeId(subject?._id || subject?.id || subject?.subjectId || "");
    if (!studentId || !subjectKey) return;
    writeStudentAuditStore(studentId, (store) => {
      const nextStore = { ...(store || {}) };
      const existing = nextStore[subjectKey] || {
        subjectId: subjectKey, subjectName: subject?.name || "Unknown Subject",
        courseId: normalizeId(subject?.category?.course?._id || subject?.category?.course),
        courseName: subject?.category?.course?.name || "General Track", categoryId: normalizeId(subject?.category?._id || subject?.category),
        categoryName: subject?.category?.name || "N/A", theory: { topics: {} }, tests: {}, meta: {},
      };
      existing.subjectName = subject?.name || existing.subjectName;
      existing.courseId = normalizeId(subject?.category?.course?._id || subject?.category?.course) || existing.courseId || "";
      existing.courseName = subject?.category?.course?.name || existing.courseName || "General Track";
      existing.categoryId = normalizeId(subject?.category?._id || subject?.category) || existing.categoryId || "";
      existing.categoryName = subject?.category?.name || existing.categoryName || "N/A";
      existing.theory = existing.theory || { topics: {} }; existing.theory.topics = existing.theory.topics || {};
      existing.tests = existing.tests || {}; existing.meta = existing.meta || {};
      const updated = updater ? updater(existing) : existing;
      nextStore[subjectKey] = updated || existing;
      return nextStore;
    });
  };

  const persistTheoryCompletion = ({ studentId, subject, topicTitle, studySeconds }) => {
    if (!studentId || !subject || !topicTitle) return;
    upsertSubjectAudit({
      studentId, subject,
      updater: (existing) => {
        existing.theory.topics[topicTitle] = { completed: true, studySeconds: Number(studySeconds) || 0, completedAt: new Date().toISOString() };
        return existing;
      },
    });
  };

  const persistTestAttempt = ({ studentId, subject, topicTitle, score, total, reason, fullscreenExits, tabSwitches, warnings, answers, durationSeconds, remainingSeconds }) => {
    if (!studentId || !subject || !topicTitle) return;
    upsertSubjectAudit({
      studentId, subject,
      updater: (existing) => {
        const payload = {
          attempted: true, attemptedAt: existing.subjectTest?.attemptedAt || new Date().toISOString(), submittedAt: new Date().toISOString(),
          score: Number(score) || 0, total: Number(total) || 0,
          percentage: Number(total) ? Math.round((Number(score || 0) / Number(total)) * 100) : 0,
          reason: reason || "submitted", fullscreenExits: Number(fullscreenExits) || 0, tabSwitches: Number(tabSwitches) || 0,
          warnings: Number(warnings) || 0, answers: answers || {}, durationSeconds: Number(durationSeconds) || 0, remainingSeconds: Number(remainingSeconds) || 0, topicTitle,
        };
        existing.subjectTest = payload; existing.tests[topicTitle] = payload;
        return existing;
      },
    });
  };

  // --- TEST TIME VALIDATION LOGIC ---
  const getTestStatus = (test) => {
    if (!test || !test.hasTest) return "no-test";
    if (!test.testDate) return "not-started";
    const now = new Date();
    const activationDate = new Date(`${test.testDate}T00:00:00`);
    if (Number.isNaN(activationDate.getTime())) return "not-started";
    if (now < activationDate) return "not-started";
    return "active";
  };

  const exitFullscreenSafe = async () => {
    try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (err) {}
  };

  const requestFullscreenSafe = async () => {
    try {
      const node = testFullscreenRef.current;
      if (node && node.requestFullscreen) await node.requestFullscreen();
      else if (document.documentElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch (err) {}
  };

  const submitCurrentTest = async (reason = "submitted") => {
    if (testEndedRef.current) return;
    testEndedRef.current = true;

    const questions = activeTopicObj?.test?.questions || [];
    const score = questions.reduce((acc, q, idx) => {
      const selected = Number(testAnswers[idx]);
      const correct = Number(q.correctOptionIndex);
      const marks = Number(q.marks) || 1;
      return acc + (selected === correct ? marks : 0);
    }, 0);

    const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

    setTestResult({ score, total: totalMarks, reason });

    try {
      await axios.post("http://localhost:5000/api/progress/save-test", {
        userId: userId,
        subjectId: currentSubjectObj?._id,
        topicTitle: activeTopicTitle,
        score: score,
        total: totalMarks,
        fullscreenExits: testFullscreenExitCount,
        tabSwitches: testTabSwitchCount,
        warnings: testViolationCount,
        durationSeconds: testSessionStartedAt ? Math.floor((Date.now() - testSessionStartedAt) / 1000) : 0,
      });
      console.log("Score updated in MongoDB backend successfully!");
      // FIXED: Refresh global state immediately so scores show up instantly
      await reloadSubjectsData(userId, isAdminLoggedIn);
    } catch (error) {
      console.error("Failed to save score on backend:", error);
    }

    if (currentTestAttemptKey) {
      localStorage.setItem(currentTestAttemptKey, "1");
      setTestAttempted(true);
    }

    setTestSessionStatus("submitted");
    setTestSessionActive(false);
    setTestWarningMessage("");
    setActiveTab("test");
    await exitFullscreenSafe();
  };

  const startTestSession = async () => {
    const subjectTestConfig = getSubjectTestConfig(currentSubjectObj);
    if (!subjectTestConfig) return;

    const status = getTestStatus(subjectTestConfig);
    if (status !== "active") return;

    if (testAttempted || (currentTestAttemptKey && localStorage.getItem(currentTestAttemptKey) === "1")) {
      alert("This test can only be attempted once. You have already submitted it.");
      setTestSessionStatus("submitted");
      setTestSessionActive(false);
      setActiveTab("test");
      return;
    }

    testEndedRef.current = false;
    lastViolationAtRef.current = 0;
    setTestAnswers({});
    setTestResult(null);
    setTestWarningMessage("");
    setTestViolationCount(0);
    setTestFullscreenExitCount(0);
    setTestTabSwitchCount(0);
    setTestSessionStartedAt(Date.now());
    
    const durationSeconds = (subjectTestConfig.durationMinutes || 10) * 60;
    setTestRemainingSeconds(durationSeconds);
    setTestSessionStatus("active");
    setTestSessionActive(true);
    setActiveTab("test");

    setTimeout(() => { requestFullscreenSafe(); }, 0);
  };

  const registerTestViolation = (reason) => {
    if (!testSessionActive || testSessionStatus !== "active" || testEndedRef.current) return;

    const now = Date.now();
    if (now - lastViolationAtRef.current < 900) return;
    lastViolationAtRef.current = now;

    const reasonLower = String(reason || "").toLowerCase();
    if (reasonLower.includes("fullscreen")) setTestFullscreenExitCount((prev) => prev + 1);
    if (reasonLower.includes("tab switched") || reasonLower.includes("hidden")) setTestTabSwitchCount((prev) => prev + 1);

    setTestViolationCount((prev) => {
      const next = prev + 1;
      if (next > MAX_TEST_VIOLATIONS) setTimeout(() => submitCurrentTest(`Auto-submitted: ${reason} (Maximum warnings exceeded)`), 0);
      else setTestWarningMessage(reason);
      return next;
    });
  };

  const handleAcknowledgeTestWarning = async () => {
    if (testEndedRef.current || testSessionStatus !== "active") return;
    await requestFullscreenSafe();
    setTestWarningMessage("");
  };

  const handleTestAnswerChange = (questionIndex, optionIndex) => {
    setTestAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  useEffect(() => {
    if (!testSessionActive || testSessionStatus !== "active" || !testRemainingSeconds) return;
    const interval = setInterval(() => {
      setTestRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => submitCurrentTest("Time Up"), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [testSessionActive, testSessionStatus, testRemainingSeconds]);

  useEffect(() => {
    if (!testSessionActive || testSessionStatus !== "active") return;

    const onVisibilityChange = () => {
      if (document.hidden) registerTestViolation("Tab switched or page minimized");
      else setTimeout(() => { if (!testEndedRef.current && testSessionStatus === "active") requestFullscreenSafe(); }, 50);
    };

    const onBlur = () => {
      registerTestViolation("Window lost focus");
      setTimeout(() => { if (!testEndedRef.current && testSessionStatus === "active") requestFullscreenSafe(); }, 50);
    };

    const onFullScreenChange = () => {
      if (!document.fullscreenElement) {
        registerTestViolation("Exited fullscreen mode");
        setTimeout(() => { if (!testEndedRef.current && testSessionStatus === "active") requestFullscreenSafe(); }, 100);
      }
    };

    const onContextMenu = (e) => { e.preventDefault(); registerTestViolation("Right-click context menu blocked"); };

    const onKeyDown = (e) => {
      const key = String(e.key || "").toLowerCase();
      if (key === "f11" || key === "f12") { e.preventDefault(); registerTestViolation("Fullscreen/DevTools toggle blocked"); return; }
      if (e.ctrlKey && e.shiftKey && key === "i") { e.preventDefault(); registerTestViolation("Developer tools blocked"); return; }
      if (e.ctrlKey && ["c", "v", "x", "u", "s", "p", "j", "k", "i", "r"].includes(key)) { e.preventDefault(); registerTestViolation(`Restricted shortcut blocked (${e.key})`); return; }
      if (e.key === "Escape") registerTestViolation("Escape key pressed");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullScreenChange);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [testSessionActive, testSessionStatus]);

  // HANDLERS
  const handleLogin = async () => {
    if (!username || !password) return setError("Please Enter Username and Password");
    try {
      const response = await axios.post("http://localhost:5000/api/users/login", { username, password });
      const safeCourses = (response.data.user.interestedCourses || []).map(c => typeof c === 'object' ? (c._id || c).toString() : c.toString());

      localStorage.setItem("token", response.data.token);
      setUserId(response.data.user.id);
      setUsername(response.data.user.username);
      setStudentCourses(safeCourses);
      
      setIsLoggedIn(true);
      setSelectedPortal("student");
      setError("");
      await reloadSubjectsData(response.data.user.id, false);
    } catch (error) {
      setError("Invalid Username or Password");
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:5000/api/users/register", {
        name, username, email, phone, dob, gender, password, interestedCourses,
      });
      alert("User Registered Successfully. Please Sign In.");
      setShowRegister(false);
      setError("");
    } catch (error) {
      setError("Registration Failed");
    }
  };

  const handleAdminLogin = async () => {
    if (!adminId || !password) return setError("Please Enter Admin ID and Password");
    try {
      const response = await axios.post("http://localhost:5000/api/admin/login", { username: adminId, password: password });
      localStorage.setItem("adminToken", response.data.token);
      
      setIsAdminLoggedIn(true);
      setSelectedPortal("admin");
      setError("");
      setPassword("");
      await reloadSubjectsData(userId, true);
    } catch (error) {
      setError(error.response?.data?.message || "Invalid Admin ID or Password");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return alert("Please enter category name");
    if (!newCategoryCourse) return alert("Please select a course for this category");

    try {
      await axios.post("http://localhost:5000/api/categories/add", { name: newCategoryName.trim(), courseId: newCategoryCourse });
      alert("Category Created Successfully!");
      setNewCategoryName("");
      setNewCategoryCourse("");
      reloadSubjectsData(userId, isAdminLoggedIn);
    } catch (error) { alert(error.response?.data?.message || "Failed to create category"); }
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return alert("Please enter course name");
    try {
      const response = await axios.post("http://localhost:5000/api/subjects/courses/add", { name: newCourseName.trim() });
      alert(response.data.message);
      setNewCourseName("");
      reloadSubjectsData(userId, isAdminLoggedIn);
    } catch (error) { alert(error.response?.data?.message || "Failed to add course"); }
  };

  const handleAddTopicToArray = () => {
    const topicValue = topicInput.trim();
    if (!topicValue || newSubjectTopics.some((topic) => normalizeText(topic) === normalizeText(topicValue))) return;
    setNewSubjectTopics([...newSubjectTopics, topicValue]);
    setTopicInput("");
  };

  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectCourse || !newSubjectCategory) return alert("Please fill all required fields");
    try {
      const response = await axios.post("http://localhost:5000/api/subjects/add", {
        name: newSubjectName.trim(), categoryId: newSubjectCategory, courseId: newSubjectCourse, topics: Array.from(new Set(newSubjectTopics)),
      });
      setAdminMessage(response.data.message);
      setNewSubjectName(""); setNewSubjectTopics([]); setNewSubjectCourse(""); setNewSubjectCategory("");
      reloadSubjectsData(userId, isAdminLoggedIn);
      setTimeout(() => setAdminMessage(""), 4000);
    } catch (error) { alert(error.response?.data?.message || "Failed to add subject"); }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await axios.delete(`http://localhost:5000/api/subjects/delete/${subjectId}`);
        alert("Subject deleted successfully!");
        reloadSubjectsData(userId, isAdminLoggedIn); 
      } catch (error) { alert("Failed to delete subject"); }
    }
  };

  const handleSaveTheoryContent = async (e) => {
    e.preventDefault();
    if (!selectedAdminSubject || !selectedAdminTopic) return;
    try {
      const response = await axios.post("http://localhost:5000/api/subjects/add-content", {
        subjectId: selectedAdminSubject._id, topicTitle: selectedAdminTopic.title, rawText: rawTextContent, allowPdf: allowPdfDownload,
      });
      alert(response.data.message);
      await reloadSubjectsData(userId, isAdminLoggedIn);
      // Keep selected state active visually
      const res = await axios.get("http://localhost:5000/api/subjects");
      setSelectedAdminSubject(res.data.find((s) => s._id === selectedAdminSubject._id));
    } catch (error) { alert("Failed to save content"); }
  };

  const handleDeleteTopic = async (subjectId, topicName) => {
    if (window.confirm(`Delete topic "${topicName}"?`)) {
      try {
        await axios.post("http://localhost:5000/api/subjects/delete-topic", { subjectId, topicName });
        await reloadSubjectsData(userId, isAdminLoggedIn);
        const res = await axios.get("http://localhost:5000/api/subjects");
        setSelectedAdminSubject(res.data.find((s) => s._id === subjectId));
        setSelectedAdminTopic(null);
      } catch (error) { alert("Failed to delete topic"); }
    }
  };

  const openSubjectTestEditor = () => {
    if (!selectedAdminSubject) return;
    const testTopic = applySubjectTestTopicState(selectedAdminSubject);
    if (!testTopic) return alert("Please add at least one topic before creating a subject test");
    setShowTestForm(true);
  };

  useEffect(() => {
    const totalQ = parseInt(testTotalQuestions) || 0;
    const totalOpt = parseInt(testOptionsPerQuestion) || 4;
    setTestQuestions((prev) => {
      const updated = [...prev];
      if (updated.length < totalQ) {
        for (let i = updated.length; i < totalQ; i++) updated.push({ questionText: "", marks: 1, options: Array(totalOpt).fill(""), correctOptionIndex: 0 });
      } else if (updated.length > totalQ) {
        return updated.slice(0, totalQ);
      }
      return updated.map((q) => {
        let opts = Array.isArray(q.options) ? [...q.options] : [];
        if (opts.length < totalOpt) opts = [...opts, ...Array(totalOpt - opts.length).fill("")];
        else if (opts.length > totalOpt) opts = opts.slice(0, totalOpt);
        return { ...q, marks: Number(q.marks) || 1, options: opts };
      });
    });
  }, [testTotalQuestions, testOptionsPerQuestion]);

  const handleUpdateQuestionData = (qIdx, field, val) => {
    const copy = [...testQuestions];
    copy[qIdx][field] = val;
    setTestQuestions(copy);
  };

  const handleUpdateOptionData = (qIdx, optIdx, val) => {
    const copy = [...testQuestions];
    copy[qIdx].options[optIdx] = val;
    setTestQuestions(copy);
  };

  const handleSaveFullTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdminSubject) return;
    const subjectTopics = Array.isArray(selectedAdminSubject.topics) ? selectedAdminSubject.topics : [];
    if (subjectTopics.length === 0) return alert("Please add at least one topic before creating a subject test");

    for (let i = 0; i < testQuestions.length; i++) {
      if (!testQuestions[i].questionText.trim()) return alert(`Please fill the question text for Question Number ${i + 1}`);
      if (!(Number(testQuestions[i].marks) > 0)) return alert(`Please enter marks for Question Number ${i + 1}`);
      for (let j = 0; j < testQuestions[i].options.length; j++) {
        if (!testQuestions[i].options[j].trim()) return alert(`Please fill Option ${j + 1} for Question Number ${i + 1}`);
      }
    }

    try {
      const targetTopics = subjectTopics.length > 0 ? [subjectTopics[0]] : [];
      const saveResponses = await Promise.all(
        targetTopics.map((topic) =>
          axios.post("http://localhost:5000/api/subjects/add-test", {
            subjectId: selectedAdminSubject._id, topicTitle: topic.title, totalQuestions: testTotalQuestions,
            optionsPerQuestion: testOptionsPerQuestion, testDate,
            questions: testQuestions.map((q) => ({
              questionText: q.questionText, marks: Number(q.marks) || 1, options: q.options, correctOptionIndex: Number(q.correctOptionIndex) || 0,
            })),
          })
        )
      );

      alert(saveResponses[0]?.data?.message || "Test saved successfully");
      setShowTestForm(false);
      await reloadSubjectsData(userId, isAdminLoggedIn);
      
      const res = await axios.get("http://localhost:5000/api/subjects");
      const freshSub = res.data.find((s) => s._id === selectedAdminSubject._id);
      setSelectedAdminSubject(freshSub);
      if (freshSub) setSelectedAdminTopic(freshSub.topics.find((t) => t.title === (selectedAdminTopic?.title || freshSub.topics?.[0]?.title)));
    } catch (err) { alert("Error while publishing test parameters"); }
  };

  const completeTopic = async (topicName) => {
    try {
      const currentSubject = subjects.find((subject) => subject.name === selectedSubject);
      const totalTopicsCount = currentSubject?.topics?.length || 1;

      await axios.post("http://localhost:5000/api/progress/save", {
        userId, subjectId: currentSubject._id, topicName, totalTopics: totalTopicsCount,
      });

      persistTheoryCompletion({ studentId: userId, subject: currentSubject, topicTitle: topicName, studySeconds });

      // FIXED: Force UI sync directly after API completes
      await reloadSubjectsData(userId, isAdminLoggedIn);
      alert(`"${topicName}" marked as completed!`);
    } catch (error) { console.log(error); }
  };

  const handleDownloadPdf = () => window.print();

  const openStudentProfileEditor = () => {
    setStudentProfileForm({
      name: localStorage.getItem("profileName") || name || "", email: localStorage.getItem("profileEmail") || email || "", phone: localStorage.getItem("profilePhone") || phone || "", dob: localStorage.getItem("profileDob") || dob || "", gender: localStorage.getItem("profileGender") || gender || "", password: "", image: localStorage.getItem("profileImage") || "",
    });
    setStudentProfilePreview(localStorage.getItem("profileImage") || "");
    setShowStudentProfileModal(true);
    setShowMenu(false);
  };

  const handleStudentProfileImageChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setStudentProfilePreview(dataUrl);
      setStudentProfileForm((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleStudentProfileSave = async () => {
    const imageValue = studentProfileForm.image || studentProfilePreview || "";
    localStorage.setItem("profileName", studentProfileForm.name || "");
    localStorage.setItem("profileEmail", studentProfileForm.email || "");
    localStorage.setItem("profilePhone", studentProfileForm.phone || "");
    localStorage.setItem("profileDob", studentProfileForm.dob || "");
    localStorage.setItem("profileGender", studentProfileForm.gender || "");
    if (imageValue) localStorage.setItem("profileImage", imageValue);
    if (studentProfileForm.password) localStorage.setItem("profilePassword", studentProfileForm.password);
    
    setName(studentProfileForm.name || ""); setEmail(studentProfileForm.email || ""); setPhone(studentProfileForm.phone || ""); setDob(studentProfileForm.dob || ""); setGender(studentProfileForm.gender || "");

    try {
      if (userId) {
        await axios.put(`http://localhost:5000/api/users/profile/${userId}`, {
          name: studentProfileForm.name, email: studentProfileForm.email, phone: studentProfileForm.phone,
          dob: studentProfileForm.dob, gender: studentProfileForm.gender, password: studentProfileForm.password || undefined,
          image: imageValue || undefined,
        });
      }
    } catch (error) { console.log("Profile save endpoint issue", error); }

    setShowStudentProfileModal(false);
    alert("Profile updated successfully");
  };

  // ==========================================
  // RENDER BLOCKS
  // ==========================================

  // GLOBAL LOADING STATE RENDER
  if (globalLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6', flexDirection: 'column' }}>
         <div style={{ width: '50px', height: '50px', border: '5px solid #ccc', borderTopColor: '#007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
         <p style={{ marginTop: '15px', color: '#555', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Loading Workspace Data...</p>
         <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (selectedPortal === "") {
    return (
      <div className="portal-page">
        <div className="portal-blur-bg"></div>
        <div className="portal-top">
          <h1 className="portal-logo">Learning Management System</h1>
        </div>
        <div className="portal-container">
          <div className="portal-card student-space-card">
            <div className="card-badge">Portal</div>
            <h2>Student</h2>
            <p>Track your courses, daily learning progress, and comprehensive theory workspace performance analytics.</p>
            <button className="portal-btn student-btn-theme" onClick={() => setSelectedPortal("student")}>Student→</button>
          </div>
          <div className="portal-card admin-space-card">
            <div className="card-badge admin-badge-tag">Management</div>
            <h2>Admin</h2>
            <p>Control board to seamlessly publish courses, manage dynamic tracking subjects, and setup student content.</p>
            <button className="portal-btn admin-btn-theme" onClick={() => setSelectedPortal("admin")}>Admin→</button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPortal === "student" && !isLoggedIn) {
    return (
      <div className="auth-wrapper">
        <div className={!showRegister ? "login-card" : "register-card"}>
          {!showRegister ? (
            <Fragment>
              <h1>Student Sign In</h1>
              <p className="subtitle">Securely log in to sync your learning analyzer</p>
              <div className="form-group">
                <label className="label">Username</label>
                <input type="text" placeholder="Enter Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleLogin}>Log In</button>
              {error && <p className="error-message">{error}</p>}
              <p className="switch-text" onClick={() => setShowRegister(true)}>New User? Create account</p>
              <p className="switch-text back-home-link" onClick={() => setSelectedPortal("")}>← Back to Main Screen</p>
            </Fragment>
          ) : (
            <Fragment>
              <div className="full-width">
                <h1>Create Student Account</h1>
                <p className="subtitle">Register to unlock real-time subject and performance tracking</p>
              </div>
              
              <div className="form-group">
                <label className="label">Full Name</label>
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Username</label>
                <input type="text" placeholder="Create Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Select Course Track</label>
                <div className="custom-multi-dropdown">
                  <div className="multi-dropdown-header" onClick={() => setShowCourseDropdown(!showCourseDropdown)}>
                    {interestedCourses.length > 0 ? `${interestedCourses.length} Course Selected` : "Select Course Track"}
                    <span>▼</span>
                  </div>
                  {showCourseDropdown && (
                    <div className="multi-dropdown-options">
                      {courses.map((course) => (
                        <label key={course._id} className="multi-dropdown-item">
                          <input type="checkbox" checked={interestedCourses.includes(course._id)}
                            onChange={(e) => {
                              if (e.target.checked) setInterestedCourses([...interestedCourses, course._id]);
                              else setInterestedCourses(interestedCourses.filter((id) => id !== course._id));
                            }}
                          />
                          {course.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="full-width">
                <button className="btn-primary" onClick={handleRegister}>Complete Registration</button>
                {error && <p className="error-message">{error}</p>}
                <p className="switch-text" onClick={() => setShowRegister(false)}>Existing User? Sign In</p>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    );
  }

  if (selectedPortal === "admin" && !isAdminLoggedIn) {
    return (
      <div className="auth-wrapper">
        <div className="login-card">
          <h1>Admin Authorization</h1>
          <p className="subtitle">Enter administrative security credentials</p>
          <div className="form-group">
            <label className="label">Admin Security ID</label>
            <input type="text" placeholder="Enter Admin ID" value={adminId} onChange={(e) => setAdminId(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleAdminLogin}>Authorize Access</button>
          {error && <p className="error-message">{error}</p>}
          <p className="switch-text back-home-link" onClick={() => { setError(""); setSelectedPortal(""); }}>← Cancel & Back</p>
        </div>
      </div>
    );
  }

  const activeSelectedStudentData = analyticsRecords.find((item) => item.profile._id === selectedStudentId);

  if (isAdminLoggedIn) {
    return (
      <div className="admin-page-root">
        <div className="main-content">
          <div className="top-bar">
            <h1>Admin Control Panel</h1>
            <div className="profile-section" ref={menuRef}>
              <button className="menu-icon-btn" onClick={() => setShowMenu(!showMenu)}>
                ☰ Actions
              </button>
              {showMenu && (
                <div className="dropdown-menu">
                  <p onClick={() => { setShowAnalytics(!showAnalytics); setShowMenu(false); }}>Analytics</p>
                  <p className="logout-link" onClick={() => {
                    localStorage.clear(); sessionStorage.clear();
                    setIsAdminLoggedIn(false); setSelectedPortal(""); setShowMenu(false); setSelectedStudentId(""); setShowAnalytics(false); setTestAttempted(false); setTestResult(null); setTestSessionStatus("idle"); setTestSessionActive(false);
                  }}>Logout</p>
                </div>
              )}
            </div>
          </div>

          {showAnalytics && (
             <div className="admin-analytics-dashboard-row-box">
             <div className="analytics-header-strip">
               <h3>Student Progress Analytics Control Center</h3>
               <p>Real-time tracking of courses metrics, profiles, and completed topics percentages.</p>
             </div>

             <div className="analytics-selector-inner-flex">
               <label className="admin-label-inline">Select Student to Inspect:</label>
               <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="admin-select-field analytics-dropdown-input">
                 <option value="">-- Choose Registered Student --</option>
                 {analyticsRecords.map((item) => (
                   <option key={item.profile._id} value={item.profile._id}>
                     {item.profile.name} (@{item.profile.username})
                   </option>
                 ))}
               </select>
             </div>

             {activeSelectedStudentData ? (
               <div className="analytics-inspection-grid">
                 <div className="student-profile-metadata-card">
                   <h4>Student Information Card</h4>
                   <div className="meta-lines-stack">
                     <p><strong>Full Name:</strong> {activeSelectedStudentData.profile.name}</p>
                     <p><strong>Email ID:</strong> {activeSelectedStudentData.profile.email}</p>
                     <p><strong>Contact No:</strong> {activeSelectedStudentData.profile.phone || "N/A"}</p>
                     <p><strong>Date of Birth:</strong> {activeSelectedStudentData.profile.dob || "N/A"}</p>
                     <p><strong>Gender Line:</strong> {activeSelectedStudentData.profile.gender || "N/A"}</p>
                     <p><strong>Course Registered:</strong> {
                       activeSelectedStudentData.profile.interestedCourses?.map(cId => {
                         const foundCourse = courses.find(c => c._id === cId || c._id.toString() === cId.toString());
                         return foundCourse ? foundCourse.name : cId;
                       }).join(', ') || "N/A"
                     }</p>
                   </div>
                 </div>

                 <div className="student-progress-matrix-table-box">
                   <h4>Course Tracking Progress Matrix</h4>
                   {activeSelectedStudentData.analytics.length === 0 ? (
                     <p className="no-analytics-data-alert">This student has not opened or started studying any topics yet.</p>
                   ) : (
                     <table className="analytics-premium-table">
                       <thead>
                         <tr>
                           <th>Course</th><th>Category</th><th>Subject</th><th>Progress of Subject (%)</th><th>Test Marks</th>
                         </tr>
                       </thead>
                       <tbody>
                         {activeSelectedStudentData.analytics
                           .filter((track) => (track.completedTopics && track.completedTopics.length > 0) || track.subjectTest?.attempted || track.tests?.length > 0)
                           .map((track, index) => {
                             let displayProgress = track.progressPercentage;
                             const matchCourse = courses.find(c => c.name === track.courseName || c._id?.toString() === track.courseId?.toString());
                             if (matchCourse) {
                               const matchSub = matchCourse.subjects?.find(s => s.name === track.subjectName || s._id?.toString() === track.subjectId?.toString()) 
                                                || subjects.find(s => s.name === track.subjectName || s._id?.toString() === track.subjectId?.toString());
                               if (matchSub && matchSub.topics && matchSub.topics.length > 0) {
                                 const localProg = progressData.find(p => p.subjectId === matchSub._id || p.subjectId?.toString() === track.subjectId?.toString());
                                 const completedCount = localProg?.completedTopics?.length || (track.completedTopics ? track.completedTopics.length : 0);
                                 displayProgress = Math.round((completedCount / matchSub.topics.length) * 100);
                               }
                             }

                             let testMarksDisplay = "Student did not give test / Not attempted";
                             let hasAttempted = false;
                             const subjectTest = track.subjectTest || track.testResult || null;
                             if (subjectTest?.attempted) {
                               testMarksDisplay = `${subjectTest.score} / ${subjectTest.total || 10}`;
                               hasAttempted = true;
                             }
                             return (
                               <tr key={index}>
                                 <td><span className="table-badge-course">{track.courseName}</span></td>
                                 <td>{track.category}</td>
                                 <td className="bold-table-subname">{track.subjectName}</td>
                                 <td>
                                   <div className="table-inline-progress-flex">
                                     <strong>{displayProgress}%</strong>
                                     <div className="table-progress-mini-bar"><div className="table-progress-fill" style={{ width: `${displayProgress}%` }}></div></div>
                                   </div>
                                 </td>
                                 <td><span className={hasAttempted ? "success-tag-done" : "no-topics-done-tag"}>{testMarksDisplay}</span></td>
                               </tr>
                             );
                           })}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>
             ) : (
                <p className="analytics-empty-state-text"></p>
             )}
           </div>
          )}

          {!showAnalytics && (
            <div className="admin-grid-layout">
              <div className="admin-forms-column">
                <div className="admin-card-box">
                  <h3 className="card-title-course">Course Management</h3>
                  <form onSubmit={handleAddCourseSubmit} className="admin-form">
                    <label className="admin-label">Course Name</label>
                    <input type="text" placeholder="e.g., B.Tech, MBBS" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="admin-input-field" />
                    <button type="submit" className="btn-create-course">+ Create Course</button>
                  </form>
                  <div className="live-items-list-container">
                    <p className="list-subheading">Active Live Courses:</p>
                    {courses.length === 0 ? <p className="no-data-text">No courses available.</p> : (
                      <div className="pill-tags-wrapper">
                        {courses.map((course) => (
                          <div key={course._id} className="course-pill-tag">
                            <span>{course.name}</span>
                            <button type="button" className="btn-delete-pill" onClick={async () => {
                                if (window.confirm(`Delete course "${course.name}"?`)) {
                                  try { await axios.delete(`http://localhost:5000/api/subjects/courses/delete/${course._id}`); reloadSubjectsData(userId, isAdminLoggedIn); } catch (err) { alert("Error deleting track"); }
                                }
                              }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-card-box">
                  <h3 className="card-title-subject">Category Management</h3>
                  <form onSubmit={handleAddCategory} className="admin-form">
                    <label className="admin-label">Category Name</label>
                    <input type="text" placeholder="e.g. Programming, Fundamentals" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="admin-input-field" />
                    <label className="admin-label">Assign to Course</label>
                    <select value={newCategoryCourse} onChange={(e) => setNewCategoryCourse(e.target.value)} className="admin-select-field">
                      <option value="">-- Select Course --</option>
                      {courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}
                    </select>
                    <button type="submit" className="btn-save-subject-db">+ Create Category</button>
                  </form>
                  <div className="live-items-list-container">
                    <p className="list-subheading">Active Categories:</p>
                    {categories.length === 0 ? <p className="no-data-text">No categories available.</p> : (
                      <div className="pill-tags-wrapper">
                        {categories.map((cat) => (
                          <div key={cat._id} className="course-pill-tag">
                            <span>{cat.name} {cat.course?.name ? `(${cat.course.name})` : ""}</span>
                            <button className="btn-delete-pill" onClick={async () => {
                                if (window.confirm(`Delete "${cat.name}" category?`)) {
                                  try { await axios.delete(`http://localhost:5000/api/categories/delete/${cat._id}`); reloadSubjectsData(userId, isAdminLoggedIn); } catch (err) { alert("Error deleting category"); }
                                }
                              }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-card-box">
                  <h3 className="card-title-subject">Add New Subject</h3>
                  <form onSubmit={handleAddSubjectSubmit} className="admin-form">
                    <label className="admin-label">Subject Name</label>
                    <input type="text" placeholder="e.g., C++, OS, Aptitude" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="admin-input-field" />
                    <label className="admin-label">Select Course</label>
                    <select value={newSubjectCourse} onChange={(e) => { setNewSubjectCourse(e.target.value); setNewSubjectCategory(""); }} className="admin-select-field">
                      <option value="">-- Select Course --</option>
                      {courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}
                    </select>
                    <label className="admin-label">Select Category</label>
                    <select value={newSubjectCategory} onChange={(e) => setNewSubjectCategory(e.target.value)} className="admin-select-field" disabled={!newSubjectCourse}>
                      <option value="">-- Select Category --</option>
                      {categories.filter((cat) => cat.course?._id?.toString() === newSubjectCourse).map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    <label className="admin-label">Add Topic Items</label>
                    <div className="topic-input-row-container">
                      <input type="text" placeholder="e.g., Arrays, Pointers, Queues" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} className="topic-input-element-field" />
                      <button type="button" onClick={handleAddTopicToArray} className="topic-add-element-btn">+ Add</button>
                    </div>
                    {newSubjectTopics.length > 0 && (
                      <div className="pending-topics-box">
                        <p className="pending-title">Pending Topics Array:</p>
                        <ul className="pending-list">{newSubjectTopics.map((t, idx) => <li key={idx}>{t}</li>)}</ul>
                      </div>
                    )}
                    <button type="submit" className="btn-save-subject-db">Save Full Subject to DB</button>
                  </form>
                  {adminMessage && <p className="success-toast-msg">{adminMessage}</p>}
                </div>
              </div>

              <div className="admin-workspace-column">
                {!selectedAdminSubject ? (
                  <Fragment>
                    <h2 className="workspace-main-heading">Live Database Overview</h2>
                    <p className="total-count-text">Total Live Subjects: <strong>{subjects.length}</strong></p>
                    <div className="subjects-vertical-list">
                      {subjects.map((sub) => (
                        <div key={sub._id} onClick={() => { setSelectedAdminSubject(sub); setSelectedAdminTopic(null); setRawTextContent(""); setShowTestForm(false); }} className="subject-list-item-card">
                          <h4 className="item-card-title">{sub.name} <span className="item-card-course-tag">[{sub.category?.course?.name || "General"}]</span></h4>
                          <p className="item-card-meta">Category: {sub.category?.name || "N/A"} | Topics Listed: {sub.topics ? sub.topics.length : 0} (Click to manage)</p>
                        </div>
                      ))}
                    </div>
                  </Fragment>
                ) : (
                  <div className="active-workspace-panel">
                    <div className="workspace-header-row">
                      <h2>{selectedAdminSubject.name} Workspace</h2>
                      <div className="workspace-action-nav-btns">
                        {selectedAdminSubject && (
                           <button onClick={() => showTestForm ? setShowTestForm(false) : openSubjectTestEditor()} className="btn-admin-add-test-action">{showTestForm ? "Edit Theory Panel" : "Add Test"}</button>
                        )}
                        <button onClick={() => { setSelectedAdminSubject(null); setSelectedAdminTopic(null); setShowTestForm(false); }} className="btn-workspace-back">⬅Back to List</button>
                      </div>
                    </div>
                    <button onClick={() => { handleDeleteSubject(selectedAdminSubject._id); setSelectedAdminSubject(null); setShowTestForm(false); }} className="btn-delete-entire-subject">Delete Subject</button>
                    <h3 className="workspace-sub-title">Select Topic to Edit Theory / Add Test:</h3>
                    <div className="topics-pill-wrapper">
                      {selectedAdminSubject.topics && selectedAdminSubject.topics.length > 0 ? (
                        selectedAdminSubject.topics.map((topic) => (
                          <span key={topic.title} onClick={() => {
                            setSelectedAdminTopic(topic); setRawTextContent(topic.theoryText || ""); setAllowPdfDownload(topic.allowPdfDownload || false);
                            if (topic.test && topic.test.hasTest) {
                              setTestTotalQuestions(topic.test.totalQuestions || 5); setTestOptionsPerQuestion(topic.test.optionsPerQuestion || 4);
                              setTestDuration(topic.test.durationMinutes || 10); setTestDate(topic.test.testDate || ""); setTestStartTime(topic.test.testStartTime || ""); setTestQuestions(topic.test.questions || []);
                            } else {
                              setTestTotalQuestions(5); setTestOptionsPerQuestion(4); setTestDuration(10); setTestDate(""); setTestStartTime(""); setTestQuestions([]);
                            }
                          }} className={`topic-pill ${selectedAdminTopic?.title === topic.title ? "active-pill" : ""}`}>
                            {topic.title} <b onClick={(e) => { e.stopPropagation(); handleDeleteTopic(selectedAdminSubject._id, topic.title); }} className="delete-topic-cross">×</b>
                          </span>
                        ))
                       ) : (
                          <p className="no-data-text">No topics found in this subject.</p>
                       )}
                    </div>
                    
                    {selectedAdminTopic && !showTestForm && (
                      <form onSubmit={handleSaveTheoryContent} className="theory-editor-form">
                        <h4>Edit Theory for: <span className="highlight-topic-name">{selectedAdminTopic.title}</span></h4>
                        <textarea value={rawTextContent} onChange={(e) => setRawTextContent(e.target.value)} placeholder="Paste or write theory text content here..." className="theory-textarea" />
                        <div className="pdf-toggle-container">
                          <input type="checkbox" id="pdfToggle" checked={allowPdfDownload} onChange={(e) => setAllowPdfDownload(e.target.checked)} className="pdf-checkbox-input"/>
                          <label htmlFor="pdfToggle" className="pdf-checkbox-label">Allow PDF Download for Students</label>
                        </div>
                        <button type="submit" className="btn-update-theory-submit">Upload Theory</button>
                      </form>
                    )}
                    
                    {selectedAdminSubject && showTestForm && (
                      <form onSubmit={handleSaveFullTestSubmit} className="test-builder-panel-form">
                        <div className="test-panel-heading-row">
                          <h4>Create Assessment: <span className="highlight-topic-name">{selectedAdminSubject.name}</span></h4>
                          <p className="panel-helper-info">*Setting parameters creates dynamic fields below instantly</p>
                        </div>
                        <div className="test-config-inline-grid">
                          <div className="form-group"><label className="admin-label">No. of Questions</label><input type="number" min="1" value={testTotalQuestions} onChange={(e) => setTestTotalQuestions(e.target.value)} className="admin-input-field" /></div>
                          <div className="form-group"><label className="admin-label">Options Per Question</label><input type="number" min="2" max="6" value={testOptionsPerQuestion} onChange={(e) => setTestOptionsPerQuestion(e.target.value)} className="admin-input-field" /></div>
                          <div className="form-group"><label className="admin-label">Activation Date</label><input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="admin-input-field" /></div>
                        </div>
                        <div className="dynamic-questions-wrapper-list">
                          {testQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="individual-question-box-item">
                              <div className="q-title-banner-index">Question #{qIdx + 1}</div>
                              <label className="admin-label">Question Text Statement</label>
                              <input type="text" placeholder={`Enter question description formula or statement for #${qIdx + 1}`} value={q.questionText || ""} onChange={(e) => handleUpdateQuestionData(qIdx, "questionText", e.target.value)} className="admin-input-field q-text-bold-input" />
                              <label className="admin-label">Marks for this Question</label>
                              <input type="number" min="1" value={q.marks || 1} onChange={(e) => handleUpdateQuestionData(qIdx, "marks", Number(e.target.value))} className="admin-input-field q-text-bold-input" />
                              <div className="options-input-inner-grid">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="option-row-box-field"><span className="opt-prefix-tag">{String.fromCharCode(65 + optIdx)})</span><input type="text" placeholder={`Option value ${optIdx + 1}`} value={opt || ""} onChange={(e) => handleUpdateOptionData(qIdx, optIdx, e.target.value)} className="admin-input-field option-clean-input" /></div>
                                ))}
                              </div>
                              <div className="correct-answer-dropdown-select-group">
                                <label className="admin-label highlight-purple-label">Choose Correct Option Key:</label>
                                <select value={q.correctOptionIndex} onChange={(e) => handleUpdateQuestionData(qIdx, "correctOptionIndex", parseInt(e.target.value))} className="admin-select-field dropdown-correct-key-select">
                                  {q.options.map((_, optIdx) => <option key={optIdx} value={optIdx}>Option {String.fromCharCode(65 + optIdx)}</option>)}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button type="submit" className="btn-publish-test-complete-db">Upload Test</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STUDENT DASHBOARD / WORKSPACE RENDER ---

  if (isLoggedIn && !isAdminLoggedIn) {
    const currentSubjectObj = subjects.find((subject) => subject.name === selectedSubject);
    const activeTopicObj = currentSubjectObj?.topics?.find(t => t.title === activeTopicTitle);
    const currentSubjectTestTopic = getSubjectTestTopic(currentSubjectObj);
    const currentSubjectTest = currentSubjectTestTopic?.test || null;
    const enrolledCourses = courses.filter((course) => studentCourses.includes(course._id.toString()));

    return (
      <div className="home-page">
        {selectedSubject ? (
          <div className="subject-layout">
            <div className="subject-sidebar">
              <p className="course-title-meta">{currentSubjectObj?.category?.course?.name || "General"} / {currentSubjectObj?.category?.name || "Category"} Track</p>
              <h2>{selectedSubject}</h2>
              <div className="topics-list">
                {currentSubjectObj?.topics?.map((topicItem) => {
                  const topicTitle = typeof topicItem === "object" ? topicItem.title : topicItem;
                  const topicText = typeof topicItem === "object" ? topicItem.theoryText : "";
                  const pdfAllowed = typeof topicItem === "object" ? topicItem.allowPdfDownload : false;
                  const currentProgress = progressData.find((item) => item.subjectId === currentSubjectObj?._id);
                  const completed = currentProgress?.completedTopics?.includes(topicTitle);

                  return (
                    <div
                      key={topicTitle}
                      className={`topic-list-item-btn ${completed ? "completed-topic" : ""} ${activeTopicTitle === topicTitle ? "active-sidebar-topic" : ""}`}
                      onClick={() => {
                        setActiveTopicTitle(topicTitle); setActiveTopicContent(topicText || "Theory content will be updated soon.");
                        setActiveTopicPdfAllowed(pdfAllowed); setStudySeconds(0); setActiveTab("theory"); 
                        setTestSessionActive(false); setTestSessionStatus("idle"); setTestRemainingSeconds(0);
                        setTestViolationCount(0); setTestFullscreenExitCount(0); setTestTabSwitchCount(0);
                        setTestSessionStartedAt(null); setTestAnswers({}); setTestResult(null); testEndedRef.current = false;
                      }}
                    >
                      <span>{completed ? "✓ " : ""}</span>{topicTitle}
                    </div>
                  );
                }) || <p className="no-data-text">No topics available</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!activeTopicTitle && currentSubjectObj?.topics?.length > 0) {
                    const testTopic = getSubjectTestTopic(currentSubjectObj);
                    const targetTopic = testTopic || currentSubjectObj.topics[0];
                    if (targetTopic) {
                      setActiveTopicTitle(typeof targetTopic === 'object' ? targetTopic.title : targetTopic);
                      setActiveTopicContent(typeof targetTopic === 'object' ? targetTopic.theoryText : "");
                      setActiveTopicPdfAllowed(typeof targetTopic === 'object' ? targetTopic.allowPdfDownload : false);
                    }
                  }
                  setActiveTab("test");
                }}
                className="btn-back-dashboard"
              >Assessment Test</button>
              <button onClick={() => {
                  setSelectedSubject(null); setActiveTopicTitle(""); setActiveTopicContent(""); setStudySeconds(0);
                  setActiveTab("theory"); setTestSessionActive(false); setTestSessionStatus("idle");
                  setTestRemainingSeconds(0); setTestViolationCount(0); setTestFullscreenExitCount(0);
                  setTestTabSwitchCount(0); setTestSessionStartedAt(null); setTestAnswers({}); setTestResult(null);
                  testEndedRef.current = false;
                }} className="btn-back-dashboard">Back to Dashboard</button>
            </div>

            <div className="subject-content">
              <div className="subject-workspace-header">
                <h1>{selectedSubject} Workspace</h1>
                <p className="workspace-sub-label">Interactive Performance Tracker</p>
              </div>
              <div className="theory-view-main-card">
                {activeTopicTitle && activeTopicObj ? (
                  <div className="printable-content-area">
                    <div className="topic-tabs">
                      <button type="button" className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`} onClick={() => setActiveTab('theory')}>Theory Material</button>
                    </div>

                    {activeTab === 'theory' && (
                      <div className="topic-meta-control-bar">
                        <div className="timer-badge-container"><span className="timer-icon"></span> Session Clock: <strong className="live-clock">{formatTime(studySeconds)}</strong></div>
                        <div className="action-buttons-group">
                          {activeTopicPdfAllowed && <button onClick={handleDownloadPdf} className="btn-download-pdf-workspace">Download PDF</button>}
                          {progressData.find((item) => item.subjectId === currentSubjectObj?._id)?.completedTopics?.includes(activeTopicTitle) ? (
                            <span className="success-tag-done">✨ Completed</span>
                          ) : (
                            <button onClick={() => completeTopic(activeTopicTitle)} className="btn-mark-completed-workspace">✓ Mark as Completed</button>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === 'theory' && <hr className="workspace-divider" />}
                    
                    {activeTab === 'theory' ? (
                      <Fragment>
                        <h3 className="theory-view-heading">Topic: {activeTopicTitle}</h3>
                        <div className="theory-view-paragraphs">{activeTopicContent}</div>
                      </Fragment>
                    ) : (
                      <Fragment>
                        {testSessionActive && testSessionStatus === "active" ? (
                          <div className="fullscreen-test-container" ref={testFullscreenRef}>
                            {testWarningMessage && (
                              <div className="test-warning-modal-overlay">
                                <div className="test-warning-modal">
                                  <h3>Warning {testViolationCount}/{MAX_TEST_VIOLATIONS}</h3>
                                  <p>You are not allowed to exit fullscreen or switch tabs during the test.</p>
                                  <p className="violation-reason">Detected: {testWarningMessage}</p>
                                  <button type="button" onClick={handleAcknowledgeTestWarning} className="btn-primary">OK</button>
                                </div>
                              </div>
                            )}
                            <div className="test-header-bar">
                              <div className="test-title">Assessment Test: {activeTopicTitle}</div>
                              <div className="test-timer">Time Left: {formatTime(testRemainingSeconds)}</div>
                              <button type="button" onClick={() => submitCurrentTest("Manual submit")} className="btn-danger">Submit Test</button>
                            </div>
                            <div className="test-questions-centered">
                                {(currentSubjectTest?.questions || []).map((question, qIdx) => (
                                  <div key={qIdx} className="test-question-card">
                                    <h4>Question {qIdx + 1} <span style={{ opacity: 0.6, fontSize: "0.9rem", fontWeight: "normal" }}>({Number(question.marks) || 1} mark{(Number(question.marks) || 1) > 1 ? "s" : ""})</span></h4>
                                    <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>{question.questionText || question.title || `Question ${qIdx + 1}`}</p>
                                    <div className="test-options-list">
                                      {(question.options || []).map((opt, optIdx) => {
                                        const label = typeof opt === "string" ? opt : (opt?.text || opt?.title || `Option ${optIdx + 1}`);
                                        return (
                                          <label key={optIdx} className="test-option-label">
                                            <input type="radio" name={`question-${qIdx}`} checked={Number(testAnswers[qIdx]) === optIdx} onChange={() => handleTestAnswerChange(qIdx, optIdx)} />
                                            <span>{String.fromCharCode(65 + optIdx)}. {label}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : testSessionStatus === "submitted" && testResult ? (
                          <div className="test-result-box">
                            <h3>Test Submitted Successfully</h3>
                            <p>Score: <strong>{testResult.score}</strong> / {testResult.total}</p>
                            <p style={{ marginTop: "12px", color: "var(--muted)" }}>Submission Reason: {testResult.reason}</p>
                            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                              <button type="button" className="btn-primary" onClick={() => { setActiveTab("theory"); setTestSessionStatus("idle"); setTestResult(null); setTestAnswers({}); }}>Back to Theory</button>
                            </div>
                          </div>
                        ) : (
                          <div className="test-container">
                            {!currentSubjectTest?.hasTest ? (
                              <div className="status-box status-neutral">Test is not uploaded yet.</div>
                            ) : (
                              <Fragment>
                                <h3 style={{ marginBottom: "16px", fontSize: "1.4rem" }}>Topic Test: {activeTopicTitle}</h3>
                                <div style={{ marginBottom: "24px", color: "var(--text-soft)" }}>
                                  <p style={{ marginBottom: "8px" }}><strong>Total Questions:</strong> {currentSubjectTest.totalQuestions || currentSubjectTest.questions?.length || 0}</p>
                                  <p style={{ marginBottom: "8px" }}><strong>Options Per Question:</strong> {currentSubjectTest.optionsPerQuestion || 4}</p>
                                  <p style={{ marginBottom: "8px" }}><strong>Activation Date:</strong> {currentSubjectTest.testDate || "N/A"}</p>
                                </div>
                                {(() => {
                                  const subjectTestConfig = getSubjectTestConfig(currentSubjectObj);
                                  const status = getTestStatus(subjectTestConfig);
                                  if (status === "not-started") {
                                    return <div className="status-box status-neutral">Test is not active yet. It will activate on {currentSubjectTest.testDate}.</div>;
                                  }
                                  if (testAttempted) {
                                    return <div className="status-box status-danger">This test has already been attempted once and cannot be started again.</div>;
                                  }
                                  return <button type="button" onClick={startTestSession} className="btn-primary">Start Fullscreen Test</button>;
                                })()}
                              </Fragment>
                            )}
                          </div>
                        )}
                      </Fragment>
                    )}
                  </div>
                ) : <div className="empty-workspace-prompt"><p></p></div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="student-dashboard-v2">
            <div className="top-bar">
              <h1>Student Dashboard</h1>
              <div className="profile-section" ref={menuRef}>
                <span className="user-welcome-tag">Welcome, <strong>{username}</strong></span>
                <img src={localStorage.getItem("profileImage") || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt="profile" className="profile-image" />
                <button className="menu-button" onClick={() => setShowMenu(!showMenu)}>☰ Menu</button>
                {showMenu && (
                  <div className="dropdown-menu">
                    <p onClick={openStudentProfileEditor}>Update Profile</p>
                    <p className="logout-red-link" onClick={() => {
                        localStorage.clear(); sessionStorage.clear();
                        setIsLoggedIn(false); setIsAdminLoggedIn(false); setUserId(""); setAdminId(""); setUsername(""); setPassword(""); setProgressData([]);
                        setShowMenu(false); setSelectedPortal(""); setActiveTab("theory"); setTestSessionActive(false); setTestSessionStatus("idle");
                        setTestRemainingSeconds(0); setTestViolationCount(0); setTestFullscreenExitCount(0); setTestTabSwitchCount(0);
                        setTestSessionStartedAt(null); setTestAnswers({}); setTestResult(null); setShowStudentProfileModal(false); testEndedRef.current = false;
                      }}>Logout</p>
                  </div>
                )}

                {showStudentProfileModal && (
                  <div className="profile-modal-backdrop">
                    <div className="profile-modal-card">
                      <h3>Update Profile</h3>
                      <p className="subtitle">You can change every field except username and registered course.</p>
                      <div className="form-group">
                        <label className="label">Profile Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleStudentProfileImageChange(e.target.files?.[0])} />
                        {(studentProfilePreview || localStorage.getItem("profileImage")) && (
                          <img src={studentProfilePreview || localStorage.getItem("profileImage")} alt="profile preview" className="profile-preview-image" />
                        )}
                      </div>
                      <div className="form-group"><label className="label">Full Name</label><input type="text" value={studentProfileForm.name} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
                      <div className="form-group"><label className="label">Email</label><input type="email" value={studentProfileForm.email} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, email: e.target.value }))} /></div>
                      <div className="form-group"><label className="label">Phone</label><input type="text" value={studentProfileForm.phone} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, phone: e.target.value }))} /></div>
                      <div className="form-group"><label className="label">Date of Birth</label><input type="date" value={studentProfileForm.dob} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, dob: e.target.value }))} /></div>
                      <div className="form-group">
                        <label className="label">Gender</label>
                        <select value={studentProfileForm.gender} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, gender: e.target.value }))}>
                          <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group"><label className="label">Username (locked)</label><input type="text" value={username} disabled /></div>
                      <div className="form-group"><label className="label">Registered Course(s)</label><input type="text" value={studentCourses.join(", ")} disabled /></div>
                      <div className="form-group"><label className="label">New Password</label><input type="password" placeholder="Leave blank to keep current" value={studentProfileForm.password} onChange={(e) => setStudentProfileForm((prev) => ({ ...prev, password: e.target.value }))} /></div>
                      <div className="action-buttons-group" style={{ justifyContent: "flex-end" }}>
                        <button type="button" className="btn-back-dashboard" onClick={() => setShowStudentProfileModal(false)}>Cancel</button>
                        <button type="button" className="btn-primary" onClick={handleStudentProfileSave}>Save Profile</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="student-dashboard-content-wrapper">
              {enrolledCourses.length === 0 ? (
                <p className="no-data-text" style={{ padding: "40px", textAlign: "center" }}>No courses assigned to your profile yet.</p>
              ) : (
                enrolledCourses.map((course) => {
                  const courseCategories = categories.filter(cat => (cat.course?._id || cat.course) === course._id);
                  let totalCourseProgress = 0; let totalSubjectsCount = 0;
                  courseCategories.forEach(cat => {
                    const catSubjects = subjects.filter(sub => (sub.category?._id || sub.category) === cat._id);
                    catSubjects.forEach(sub => {
                      const prog = getStudentSubjectProgress(sub); totalCourseProgress += (prog?.progressPercentage || 0); totalSubjectsCount++;
                    });
                  });
                  const avgCourseProgress = totalSubjectsCount === 0 ? 0 : Math.round(totalCourseProgress / totalSubjectsCount);

                  return (
                    <div key={course._id} className="premium-course-card">
                      <div className="course-card-header">
                        <div className="course-info">
                          <h2>{course.name}</h2>
                          <p>Comprehensive Learning Track Dashboard</p>
                          <div className="course-progress-indicator">
                            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--blue-2)" }}>Overall Progress: {avgCourseProgress}%</span>
                            <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${avgCourseProgress}%` }}></div></div>
                          </div>
                        </div>
                        <div className="course-actions">
                          <button className="btn-outline-primary" onClick={() => alert("Please open a subject category below to start taking module tests.")}>Start Test</button>
                          <button className="btn-primary" onClick={() => document.getElementById(`course-cats-${course._id}`).scrollIntoView({ behavior: 'smooth' })}>Continue Learning</button>
                        </div>
                      </div>

                      <div id={`course-cats-${course._id}`} className="course-categories-container">
                        {courseCategories.length === 0 ? (
                          <p className="no-data-text">No categories published for this course yet.</p>
                        ) : (
                          courseCategories.map((category) => {
                            const categorySubjects = subjects.filter(sub => (sub.category?._id || sub.category) === category._id);
                            return (
                              <div key={category._id} className="horizontal-category-strip">
                                <div className="category-strip-header"><h3>{category.name} Module</h3></div>
                                <div className="subjects-flex-grid">
                                  {categorySubjects.length === 0 ? (
                                    <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>No subjects uploaded here yet.</p>
                                  ) : (
                                    categorySubjects.map((subject) => {
                                      const progress = getStudentSubjectProgress(subject);
                                      return (
                                        <div key={subject._id} className="modern-subject-card" onClick={() => setSelectedSubject(subject.name)}>
                                          <h4>{subject.name}</h4>
                                          <div className="subject-card-footer">
                                            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500" }}>Progress</span>
                                            <span style={{ fontSize: "12px", color: "var(--blue-2)", fontWeight: "700" }}>{progress?.progressPercentage || 0}%</span>
                                          </div>
                                          <div className="small-progress-bar"><div className="small-progress-fill" style={{ width: `${progress?.progressPercentage || 0}%` }}></div></div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;