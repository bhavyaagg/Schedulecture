/**
 * Created by bhavyaagg on 01/10/17.
 */

$(document).ready(function () {

  let clienttokenArray = window.location.href.split('?');
  let getBatch = "all";

  if (clienttokenArray
    && clienttokenArray.length === 2
    && clienttokenArray[1].indexOf("clienttoken=") !== -1
    && clienttokenArray[1].indexOf("name=") !== -1) {

    let queryArray = clienttokenArray[1].split('&');
    let clientToken = queryArray[0].split('clienttoken=')[1];
    let name = queryArray[1].split('name=')[1];

    localStorage.setItem('clienttoken', clientToken);
    localStorage.setItem('name', name);

    window.location.replace('/admin');
  }

  if (clienttokenArray
    && clienttokenArray.length === 2
    && clienttokenArray[1].indexOf("batch=") !== -1) {
    getBatch = clienttokenArray[1].split("batch=")[1];
  }

  var api = '/api/v1';

  function getCentres() {

    $.get(`${api}/centres`).done((centresData) => {
      if (centresData) {
        const centres = centresData.data;
        const $centres = $("#centres");
        centres.forEach((centre) => {
          $centres.append(`
            <option value="${centre.id}">${centre.name}</option>
          `);
        });
        showBatchesAndRooms(centres[0]);

        $centres.change(() => {
          getCentre(+($centres.val()));
        })
      } else {
        $.toast({
          heading: 'Warning',
          icon: 'error',
          text: `No Centres`,
          position: 'top-right',
          stack: 4,
          hideAfter: 4000,
          showHideTransition: 'slide',
          loaderBg: '#fc4f4f;'
        });
      }
    }).fail((err) => {
      $.toast({
        heading: 'Warning',
        icon: 'error',
        text: `No Centres`,
        position: 'top-right',
        stack: 4,
        hideAfter: 4000,
        showHideTransition: 'slide',
        loaderBg: '#fc4f4f;'
      });
      console.log(err);
    });

  }

  getCentres();

  function getCentre(centreId) {
    $.get(`${api}/centres/${centreId}`).done((centreData) => {
      if (centreData.success) {
        showBatchesAndRooms(centreData.data);
      } else {
        $.toast({
          heading: 'Warning',
          icon: 'error',
          text: `Unknown Centres`,
          position: 'top-right',
          stack: 4,
          hideAfter: 4000,
          showHideTransition: 'slide',
          loaderBg: '#fc4f4f;'
        });
      }
    }).fail((err) => {
      $.toast({
        heading: 'Warning',
        icon: 'error',
        text: `Unknown Centres`,
        position: 'top-right',
        stack: 4,
        hideAfter: 4000,
        showHideTransition: 'slide',
        loaderBg: '#fc4f4f;'
      });
      console.log(err);
    });
  }

  function showBatchesAndRooms(centre) {

    const events = [];
    const resources = [];
    const colors = ['#EB5667', '#1E88E5', '#B96BC6', '#28B294', '#FF8F00', '#31C6C7'];
    let colorCounter = 0;

    $('#calendar').remove();

    $('#calendarContainer').append(`
    <div id="calendar"></div>
    `);

    $.get(`${api}/centres/${centre.id}/rooms`).done((roomsData) => {
      if (roomsData.success) {

        const rooms = roomsData.data;
        const $colors = $('#colors');
        $colors.empty().append(`
              <div class="col">
              </div>
              <div class="col">
              </div>
          `);

        rooms.forEach((room) => {
          let currentColor = colors[colorCounter++ % colors.length];
          resources.push({
            id: room.id,
            title: room.name,
            eventColor: currentColor,
            capacity: room.capacity,
            centreId: room.centreId
          });
          $colors.append(`
              <div class="col">
                <div style="display: inline-block;height: 15px;width: 15px; background-color: ${currentColor}"></div>
                <span>${room.name}</span>
              </div>
          `)
        });

        $colors.append(`
              <div class="col">
              </div>
              <div class="col">
              </div>
          `);

        $.get(`${api}/centres/${centre.id}/batches/?batch=${getBatch}`).done((data) => {
          if (data.success) {
            let batches = data.data;

            batches.forEach(function (batch) {

              let lectures = batch.lectures;
              lectures.forEach((lecture) => {
                if (lecture.startTime && lecture.endTime) {
                  events.push({
                    lectureId: lecture.id,
                    title: lecture.name,
                    start: moment.utc(lecture.startTime),
                    end: moment.utc(lecture.endTime),
                    stick: true,
                    resourceId: lecture.roomId,
                    batchCapacity: batch.size,
                    batchName: batch.name,
                    teacherName: batch.teacher.name,
                    courseName: batch.course.name
                  });
                }
              });

            });

            $('#calendar').fullCalendar({
              // put your options and callbacks here
              schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
              header: {
                left: 'prev,next,today',
                center: 'title',
                right: 'month,agendaSevenDay,agendaFiveDay,agendaTwoDay,agendaOneDay'
              },
              fixedWeekCount: false,
              minTime: "07:00:00",
              maxTime: "22:00:00",
              height: 'auto',
              events: events,
              dayClick: function (date, jsEvent, view, resourceObj) {
                $('#calendar').fullCalendar('changeView', 'agendaOneDay', date);
              },
              resources: resources,
              views: {
                agendaFiveDay: {
                  type: 'agenda',
                  duration: {days: 5},
                  groupByDateAndResource: true,
                  buttonText: '5 days',
                  dateIncrement: {days: 1}
                },
                agendaTwoDay: {
                  type: 'agenda',
                  duration: {days: 2},
                  groupByDateAndResource: true,
                  buttonText: '2 days',
                  dateIncrement: {days: 1}
                },
                agendaOneDay: {
                  type: 'agenda',
                  duration: {days: 1},
                  groupByDateAndResource: true,
                  buttonText: 'day',
                  dateIncrement: {days: 1}
                },
                agendaSevenDay: {
                  type: 'agenda',
                  duration: {days: 7},
                  groupByDateAndResource: true,
                  dateIncrement: {days: 1}
                }

              },
              eventMouseover: function (event, jsEvent, view) {
                var index = -1;
                resources.map(function (v, i) {
                  if (v.id === +event.resourceId) {
                    index = i;
                  }
                  return v;
                });

                $(jsEvent.currentTarget).tooltip(
                  {
                    html: true,
                    title: `
                              Course: ${event.courseName}<br/>
                              Batch: ${event.batchName}<br/>
                              Teacher: ${event.teacherName}<br/>
                              Batch Capacity: ${event.batchCapacity}<br/>                             
                              Room: ${resources[index].title}<br/>
                    `
                  }).tooltip('show');
              }
            });
          } else {
            $.toast({
              heading: 'Warning',
              icon: 'error',
              text: `There are no Batches`,
              position: 'top-right',
              stack: 4,
              hideAfter: 4000,
              showHideTransition: 'slide',
              loaderBg: '#fc4f4f;'
            })
          }
        }).fail((err) => {
          $.toast({
            heading: 'Warning',
            icon: 'error',
            text: `No Batches At This Centre`,
            position: 'top-right',
            stack: 4,
            hideAfter: 4000,
            showHideTransition: 'slide',
            loaderBg: '#fc4f4f;'
          });
          console.log(err)
        })
      } else {
        $.toast({
          heading: 'Warning',
          icon: 'error',
          text: `No Rooms At This Centre.`,
          position: 'top-right',
          stack: 4,
          hideAfter: 4000,
          showHideTransition: 'slide',
          loaderBg: '#fc4f4f;'
        });
      }

    }).fail((err) => {
      $.toast({
        heading: 'Warning',
        icon: 'error',
        text: `No Rooms At This Centre.`,
        position: 'top-right',
        stack: 4,
        hideAfter: 4000,
        showHideTransition: 'slide',
        loaderBg: '#fc4f4f;'
      });
      console.log(err)
    });
  }
});
