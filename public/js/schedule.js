document.addEventListener('DOMContentLoaded', function() {
    let currentEventId = null; // This variable will hold the ID of the event to be interacted with
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        events: '/api/tasks',
        locale: 'eng',

        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        selectable: true,
        editable: true,
        
        select: function(selectInfo) {
            const title = prompt('Event Title:');
            if (title) {
                const isConfirmed = true;
                if (isConfirmed) {
                    const eventData = {
                        title: title,
                        start: selectInfo.startStr,
                        end: selectInfo.endStr,
                        allDay: selectInfo.allDay
                    };
                    
                    $.ajax({
                        url: '/api/tasks',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(eventData),
                        success: function(data) {
                            console.log('Event added successfully', data);
                            
                            calendar.addEvent({
                                ...data,
                                id: data.task_id,
                                title: data.title,
                                start: data.start,
                                end: data.end_event,
                                allDay: data.all_day
                            });
                        },
                        error: function(xhr, status, error) {
                            console.error('Error adding event:', error);
                        }
                    });
                }
            }
        },

        eventDidMount: function(info) {
            console.log("Event details:", info.event); 
            console.log("Mounted event ID:", info.event.id); 
            info.el.addEventListener('contextmenu', function(e) {
                e.preventDefault(); // Prevent the default context menu from showing
                showContextMenu(e, info.event.id); // Pass the event id to the showContextMenu function
            });
            if (info.event.extendedProps.completed) {
                // Apply gray background color for completed tasks/events
                info.el.style.backgroundColor = 'gray';
                info.el.style.borderColor= 'gray';
            }
        },

        eventDrop: function(info) {
            console.log(info.event);
            // Called when an event is dropped at a new date/time.
            updateEventInDatabase(info.event);
        },
        eventResize: function(info) {
            console.log(info.event);
            // Called when an event's end date/time has been changed.
            updateEventInDatabase(info.event);
        },
    });

    

    function showContextMenu(e, eventId) {
        e.preventDefault(); // Prevent the default context menu from showing
        currentEventId = eventId; // Store the ID of the event that was right-clicked
        currentEventId = parseInt(currentEventId);
        console.log(typeof(currentEventId));

        const contextMenu = document.getElementById("contextMenu");
        contextMenu.style.display = "block";
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
    }

    // Assuming deleteEvent function exists and handles event deletion
    
    document.addEventListener('click', function(e) {
        const contextMenu = document.getElementById("contextMenu");
        const deleteButton = document.getElementById("deleteEvent");
    
        // Check if the click is outside the context menu and not on the delete button
        if (!contextMenu.contains(e.target) && e.target !== deleteButton) {
            contextMenu.style.display = 'none'; // Hide the context menu
            currentEventId = null; // Optionally reset the current event ID if necessary
        }
    });

    document.getElementById("deleteEvent").addEventListener('click', function() {
        if (currentEventId !== null) {
            
            
            fetch('api/tasks/' + parseInt(currentEventId) , {
                method: 'DELETE',
                credentials: 'include',
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete event');
                return response.json();
            })
            .then(() => {
                console.log('Event deleted successfully');
                // Remove the event from FullCalendar
                let event = calendar.getEventById(currentEventId);
                if (event) event.remove();
    
                // Hide the context menu
                document.getElementById("contextMenu").style.display = 'none';
                currentEventId = null;
            })
            .catch(error => console.error('Error deleting event:', error));
        }
                
    });

    function toUTCDate(localDate) {
        return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), localDate.getHours(), localDate.getMinutes(), localDate.getSeconds()));
    }

    function updateEventInDatabase(event) {
        const eventId = event.id; // Use event.id which should correspond to task_id in your DB
        const start = event.startStr; // Use startStr and endStr which are already in ISO8601 format
        const end = event.endStr; 
        const title = event.title; // Assuming you're getting this from somewhere
        const allDay = event.allDay; // Assuming this is part of your event object
    
        console.log("Updating event ID:", eventId); // Add this line
        fetch('/api/tasks/' + eventId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title, // Ensure title is included if it's being updated
                allDay, // Same for allDay
                start,
                end,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not update event.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Event updated successfully', data);
            // Optionally refresh the event in FullCalendar or handle UI updates
        })
        .catch(error => {
            console.error('Error updating event:', error);
        });
    }
    
    
    
    calendar.render();
});