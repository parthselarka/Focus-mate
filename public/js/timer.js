document.addEventListener('DOMContentLoaded', () => {
    fetchSettingsAndInitializeTimer();
    let workDuration = parseInt(localStorage.getItem('workDuration')) || 25 * 60;
    let breakDuration = parseInt(localStorage.getItem('breakDuration')) || 5 * 60;
    let isWorkSession = true;
    let time = parseInt(localStorage.getItem('time')) || workDuration; // Initialize time based on saved value or default workDuration
    let countdown;  

    const timeDisplay = document.getElementById('time');
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const resetButton = document.getElementById('reset');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');

    const startaudio = document.getElementById("start-sound");
    const pauseaudio = document.getElementById("pause-sound");
    const restartaudio = document.getElementById("restart-sound");
    const alarmaudio = document.getElementById("alarm-sound");  

    fetch('/api/tasks/today', { credentials: 'include' })
    .then(response => response.json())
    .then(tasks => {
        const tasksList = document.getElementById('todayTasks');
        if (!tasksList) {
            console.log('Task list element is not found');
            return;
        }

        tasksList.innerHTML = ''; // Clear previous tasks to avoid duplication

        if (tasks.length === 0) {
            const noTasksMessage = document.createElement('li');
            taskMessage.textContent = 'Enter task in schedule';
        } else {
            tasks.forEach(task => {
                // Ensure task has the required properties
                if (task.title !== undefined && task.completed !== undefined) {
                    const taskItem = document.createElement('li');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.dataset.taskid = task.id || ''; // Add task ID if needed
                    checkbox.checked = task.completed;

                    // Optionally add a checkbox or similar to mark completion
                    taskItem.appendChild(checkbox);
                    taskItem.appendChild(document.createTextNode(task.title));
                    taskItem.className = task.completed ? 'completed' : '';

                    tasksList.appendChild(taskItem);
                } else {
                    console.log('Task object is missing required properties:', task);
                }
            });
        }
    })
    .catch(error => console.error('Error:', error));

    let isPaused = false;

    startButton.addEventListener('click', () => {
        if (!isPaused) {
            workDuration = parseInt(workDurationInput.value) * 60;
            breakDuration = parseInt(breakDurationInput.value) * 60;
            time = isWorkSession ? workDuration : breakDuration;
        }
        clearInterval(countdown);
        countdown = setInterval(updateTimer, 1000);
        isPaused = false; // Reset pause status
        stopButton.disabled = false;
        startButton.disabled = true;
        startaudio.play();
    });

    stopButton.addEventListener('click', () => {
        clearInterval(countdown);
        isPaused = true; // Update pause status
        stopButton.disabled = true;
        startButton.disabled = false;
        pauseaudio.play();
    });

    resetButton.addEventListener('click', () => {
        clearInterval(countdown);
        time = workDuration;
        isWorkSession = true;
        isPaused = false; // Reset pause status
        updateDisplay();
        stopButton.disabled = true;
        startButton.disabled = false;
        restartaudio.play();
    });

    function updateTimer() {
        if (!isPaused) {
            time--;
            updateDisplay();

            if (time < 0) {
                alarmaudio.play();
                clearInterval(countdown);
                isWorkSession = !isWorkSession;
                time = isWorkSession ? workDuration : breakDuration;
                alert(isWorkSession ? 'Break is over! Start working.' : 'Work session is over! Take a break.');
                countdown = setInterval(updateTimer, 1000);            
            }
        }
    }

    function updateDisplay() {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    updateDisplay();
});

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/timer/settings', { credentials: 'include' })
    .then(response => response.json())
    .then(settings => {
        document.getElementById('workDuration').value = settings.work_duration;
        document.getElementById('breakDuration').value = settings.break_duration;
        // Initialize the timer with these settings...
    })
    .catch(error => console.error('Error:', error));
});

document.getElementById('start').addEventListener('click', () => {
    const workDuration = document.getElementById('workDuration').value;
    const breakDuration = document.getElementById('breakDuration').value;

    fetch('/api/timer/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ work_duration: workDuration, break_duration: breakDuration }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Settings updated:', data);
        // Apply the new settings to the timer...
    })
    .catch(error => console.error('Error:', error));
});

function fetchSettingsAndInitializeTimer() {
    fetch('/api/timer/settings', { credentials: 'include' })
    .then(response => response.json())
    .then(settings => {
        const workDurationInput = document.getElementById('workDuration');
        const breakDurationInput = document.getElementById('breakDuration');
        const timeDisplay = document.getElementById('time');
        
        // Set the input values based on fetched settings
        workDurationInput.value = settings.work_duration;
        breakDurationInput.value = settings.break_duration;
        
        // Initialize the timer display based on the work duration
        let minutes = settings.work_duration;
        timeDisplay.textContent = `${minutes}:00`;
        
        // Initialize other timer variables based on settings
        workDuration = settings.work_duration * 60; // Convert minutes to seconds
        breakDuration = settings.break_duration * 60; // Convert minutes to seconds
        time = workDuration; // Initialize 'time' with workDuration for the first session
    })
    .catch(error => {
        console.error('Error:', error);
        // Initialize with default values in case of error
        document.getElementById('time').textContent = '25:00';
    });
}




function fetchTasksAndDisplay() {
    fetch('/api/tasks/today', { credentials: 'include' })
    .then(response => response.json())
    .then(tasks => displayTasks(tasks))
    .catch(error => console.error('Error:', error));
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('todayTasks');
    tasksList.innerHTML = ''; // Clear previous tasks to avoid duplication

    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.textContent = task.title; // Display task title

        // Create checkbox to mark task completion
        const checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.checked = task.completed; // Set based on task completion status
        checkBox.setAttribute('data-taskid', task.task_id); // Store taskId

        // Add change event listener to update task completion status
        checkBox.addEventListener('change', function() {
            const taskId = this.getAttribute('data-taskid');
            completeTask(taskId, this.checked);
        });

        taskItem.prepend(checkBox); // Add checkbox to the beginning of the task item
        tasksList.appendChild(taskItem); // Add task item to the list
    });
}

function completeTask(taskId, completed, calendar) {
    fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to complete task');
        fetchTasksAndDisplay(); // Refresh the tasks list to reflect changes
        console.log(calendar);
        const event = calendar.getEventById(taskId);
        if (event){
            event.setProp('backgroundColor', completed ? 'grey' : ''); // Set to grey if completed, or revert to default
            event.setProp('borderColor', completed ? 'grey' : ''); // Same for the border color
        }
    })
    .catch(error => console.error('Error:', error));
}



document.addEventListener('DOMContentLoaded', () => {
    fetchTasksAndDisplay(); // Call this function to load tasks when the page loads
});
