import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove, set, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPl8uaPdFS89m6X4M3OrzTSSeHhw-GkRkRk",
  authDomain: "team-waffles-acs.firebaseapp.com",
  projectId: "team-waffles-acs",
  storageBucket: "team-waffles-acs.appspot.com",
  messagingSenderId: "636130806538",
  appId: "1:636130806538:web:281c39ba2e72debd2748f3",
  measurementId: "G-HEC29JWVFL",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Get references for DOM elements
const surveyList = document.getElementById("survey-list");
const userList = document.getElementById("user-management");

// Add Survey Question
document.getElementById("add-survey").addEventListener("click", () => {
  const question = document.getElementById("survey-question").value;
  const type = document.getElementById("question-type").value;
  const adminName = document.getElementById("admin-name").value;

  if (question && adminName) {
    push(ref(db, "surveyQuestions"), { question, type, createdBy: adminName, timestamp: Date.now() })
      .then(() => {
        set(ref(db, `recentSurveys/${Date.now()}`), {
          question,
          type,
          createdBy: adminName,
          timestamp: Date.now(),
        });

        document.getElementById("survey-question").value = "";
        document.getElementById("question-type").value = "";
        document.getElementById("admin-name").value = "";

        alert("Survey added and logged!");
      })
      .catch((error) => {
        console.error("Error adding survey:", error);
      });
  } else {
    alert("Please fill in all fields.");
  }
});

function loadUserResponses() {
  const responsesRef = ref(db, "responses");

  onValue(responsesRef, (snapshot) => {
    const userManagementDiv = document.querySelector("#userManagement");
    userManagementDiv.innerHTML = ""; // Clear content

    if (snapshot.exists()) {
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const userResponses = userSnapshot.val();

        const userDiv = document.createElement("div");
        userDiv.classList.add("user-item");
        userDiv.innerHTML = `
          <strong>User ID:</strong> ${userId}<br>
          <strong>Responses:</strong><br>
        `;

        Object.entries(userResponses).forEach(([question, answer]) => {
          userDiv.innerHTML += `Question ${question}: ${answer}<br>`;
        });

        userManagementDiv.appendChild(userDiv);
      });
    } else {
      console.log("No responses found.");
      userManagementDiv.innerHTML = "<p>No user responses available.</p>";
    }
  });
}

const responsesRef = ref(db, "responses");

onValue(responsesRef, (snapshot) => {
  console.log("Snapshot exists:", snapshot.exists());
  console.log("Snapshot value:", snapshot.val());
});

function loadSurveys() {
  const surveysRef = ref(db, "surveyQuestions");

  onValue(surveysRef, (snapshot) => {
    surveyList.innerHTML = ""; // Clear the current content

    if (snapshot.exists()) {
      let surveyIndex = 1;
      snapshot.forEach((child) => {
        const surveyData = child.val();
        const surveyKey = child.key;

        const div = document.createElement("div");
        div.classList.add("survey-item");
        div.innerHTML = `
          <strong>Survey #${surveyIndex}:</strong><br>
          <strong>Question:</strong> ${surveyData.question || "N/A"}<br>
          <strong>Type:</strong> ${surveyData.type || "N/A"}<br>
          <strong>Created by:</strong> ${surveyData.createdBy || "N/A"}<br>
          <button class="delete-btn">Delete</button>
        `;

        // Add the delete button functionality
        const deleteBtn = div.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => {
          if (confirm("Are you sure you want to delete this survey?")) {
            remove(ref(db, `surveyQuestions/${surveyKey}`))
              .then(() => {
                alert("Survey deleted!");
                div.remove(); // Remove the deleted survey item from the DOM
              })
              .catch((error) => {
                console.error("Error deleting survey:", error);
                alert("There was an error deleting the survey. Please try again.");
              });
          }
        });

        // Append the survey div to the survey list
        surveyList.appendChild(div);
        surveyIndex++;
      });
    } else {
      console.log("No surveys found.");
    }
  });
}
// Award Points
document.getElementById("award-points").addEventListener("click", () => {
  const adminName = document.getElementById("admin-name").value.trim();
  const userId = document.getElementById("user-id").value.trim();
  const pointsToAdd = parseInt(document.getElementById("points-to-add").value.trim(), 10);

  // Log input values to see if they are valid
  console.log("Admin Name:", adminName);
  console.log("User ID:", userId);
  console.log("Points to Add:", pointsToAdd);

  // Check that all values are present and valid
  if (adminName && userId && !isNaN(pointsToAdd) && pointsToAdd > 0) {
    const userRef = ref(db, `users/${userId}`);

    onValue(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const currentPoints = snapshot.val()?.points || 0;
          const newPoints = currentPoints + pointsToAdd;

          if (newPoints > 1000000) {
            alert("Cannot add more than 1,000,000 points!");
            return;
          }

          update(userRef, { points: newPoints });

          // Get the current timestamp in a readable format
          const timestamp = new Date().toLocaleString();

          // Log the data that will be saved in Firebase
          console.log("Saving to Firebase:", {
            admin: adminName,
            points: pointsToAdd,
            timestamp,
          });

          // Save points transaction to the user's recentPoints
          push(ref(db, `users/${userId}/recentPoints`), {
            admin: adminName,
            points: pointsToAdd,
            timestamp: timestamp,
          });

          // Log points addition under the global recentPoints section
          set(ref(db, `recentPoints/${timestamp}`), {
            user: userId,
            pointsAwarded: pointsToAdd,
            awardedBy: adminName,
            timestamp,
          });

          alert("Points awarded and logged!");
        } else {
          alert("User not found!");
        }
      },
      { onlyOnce: true }
    );
  } else {
    alert("Please fill in all fields with valid data.");
  }
});



// Display Users
if (userList) {
  onValue(ref(db, "users"), (snapshot) => {
    userList.innerHTML = "";

    snapshot.forEach((child) => {
      const userData = child.val();
      const userKey = child.key;

      const div = document.createElement("div");
      div.classList.add("user-item");
      div.innerHTML = `
        ${userData.name || `User ID: ${userKey}`} - Points: ${userData.points || 0}
        <button class="add-points-btn">Add Points</button>
        <button class="delete-user-btn">Delete</button>
        <div class="recent-points"><strong>Recent Points:</strong></div>
      `;

      const addPointsBtn = div.querySelector(".add-points-btn");
      addPointsBtn.addEventListener("click", () => {
        const newPoints = parseInt(prompt("Enter points to add:", "0"), 10);
        if (!isNaN(newPoints) && newPoints > 0) {
          update(ref(db, `users/${userKey}`), { points: (userData.points || 0) + newPoints });
        } else {
          alert("Invalid points value.");
        }
      });

      const deleteUserBtn = div.querySelector(".delete-user-btn");
      deleteUserBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this user?")) {
          remove(ref(db, `users/${userKey}`));
        }
      });

      const recentPointsDiv = div.querySelector(".recent-points");
      onValue(ref(db, `users/${userKey}/recentPoints`), (recentPointsSnapshot) => {
        recentPointsDiv.innerHTML = `<strong>Recent Points:</strong>`;
        if (recentPointsSnapshot.exists()) {
          recentPointsSnapshot.forEach((recentPointChild) => {
            const pointData = recentPointChild.val();
            const pointDiv = document.createElement("div");
            pointDiv.innerHTML = `
              Points: ${pointData.pointsAwarded} | Admin: ${pointData.awardedBy} | Timestamp: ${new Date(pointData.timestamp).toLocaleString()}
            `;
            recentPointsDiv.appendChild(pointDiv);
          });
        } else {
          recentPointsDiv.innerHTML += " No recent points.";
        }
      });

      userList.appendChild(div);
    });
  });
} else {
  console.error("user-management element not found");
}

// Load surveys on page load
window.addEventListener("load", loadSurveys);
loadUserResponses();

