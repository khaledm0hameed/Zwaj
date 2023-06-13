// (c) 2020-2022 Written by Simon Köhler in Panama
// github.com/koehlersimon
// simon-koehler.com

// No JavaScript needed for this example anymore!

document.addEventListener("click", function (e) {
  // Hamburger menu
  if (e.target.classList.contains("hamburger-toggle")) {
    e.target.children[0].classList.toggle("active");
  }
});

// Recorder Start //

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
var audio_file;

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var recorder; //stream from getUserMedia()
var recorder2; //stream from getUserMedia()
var recorder3; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

if (recordButton) {
  //add events to those 2 buttons
  recordButton.addEventListener("click", startRecording);
  stopButton.addEventListener("click", stopRecording);
  pauseButton.addEventListener("click", pauseRecording);
}

function startRecording() {
  $("#recordingsList").empty();

  /*
    Simple constraints object, for more advanced audio features see
    https://addpipe.com/blog/audio-constraints-getusermedia/
  */

  var constraints = { audio: true, video: false };

  /*
      Disable the record button until we get a success or fail from getUserMedia()
  */

  recordButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;

  /*
      We're using the standard promise based getUserMedia()
      https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  */
  // Drawing The Bars Start //
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    audioContext = new AudioContext();
    recorder2 = new MediaRecorder(stream);
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    canvasContext = $("#canvas")[0].getContext("2d");

    javascriptNode.onaudioprocess = function () {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;

      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += array[i];
      }

      var average = values / length;
      canvasContext.clearRect(0, 0, 60, 130);
      canvasContext.fillStyle = "#00ff00";
      canvasContext.fillRect(0, 130 - average, 25, 130);
    };
  });
  // Drawing The Bars End //

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      audioContext = new AudioContext();
      recorder3 = new MediaRecorder(stream);
      gumStream = stream;

      input = audioContext.createMediaStreamSource(stream);
      rec = new Recorder(input, { numChannels: 1 });
      rec.record();
    })
    .catch(function (err) {
      alert(
        "فى حال عدم السماح للتسجيل من خلال المايكروفون لا يمكنك التسجيل برجاء قم بإعطاء تصريح للمايكروفون",
        err
      );
      //enable the record button if getUserMedia() fails
      recordButton.disabled = false;
      stopButton.disabled = true;
      pauseButton.disabled = true;
    });
}

function pauseRecording() {
  //console.log("pauseButton clicked rec.recording=",rec.recording );
  if (rec.recording) {
    //pause
    rec.stop();
    pauseButton.innerHTML = "<i class='fa-solid fa-circle-pause'></i> استمرار";
  } else {
    //resume
    rec.record();
    pauseButton.innerHTML = "<i class='fa-solid fa-circle-stop'></i> ايقاف ";
  }
}

function stopRecording() {
  //disable the stop button, enable the record too allow for new recordings
  stopButton.disabled = true;
  recordButton.disabled = false;
  pauseButton.disabled = true;

  //reset button just in case the recording is stopped while paused
  pauseButton.innerHTML = "<i class='fa-solid fa-circle-stop'></i> ايقاف ";

  //tell the recorder to stop the recording
  rec.stop();
  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
  //stop microphone access

  recorder2.stream.getAudioTracks().forEach((track) => {
    track.stop();
    track.enabled = false;
  });

  recorder3.stream.getAudioTracks().forEach((track) => {
    track.stop();
    track.enabled = false;
  });
}

function createDownloadLink(blob) {
  var url = URL.createObjectURL(blob);
  audio_file = blob;

  var source = document.createElement("source");
  var au = document.createElement("audio");

  //add controls to the <audio> element
  au.controls = true;
  source.src = url;

  au.appendChild(source);

  recordingsList.innerHTML = "";
  recordingsList.appendChild(au);
}

// Recorder End//

function scrollTo(IdorClass) {
  var element_validate = $(IdorClass + " ");

  if (element_validate.length) {
    $("body,html").animate(
      {
        scrollTop: element_validate.offset().top - 100,
      },
      100,
      "swing"
    );
  }
}

$(document).ready(function () {
  $(document).on("submit", ".registerform", function () {
    var form_id = ".registerform";
    var btn = '<i class="fa fa-plus"></i> تسجيل الاستمارة';
    var btnbefore = '<i class="fa fa-spin fa-spinner"></i> تسجيل الاستمارة';
    var formData = new FormData($(this)[0]);

    if (audio_file != undefined) {
      formData.append("audio_file", audio_file);
    }

    $.ajax({
      url: $(this).attr("action"),
      dataType: "json",
      type: "post",
      data: formData,
      processData: false,
      contentType: false,
      beforeSend: function () {
        $(".register").html(btnbefore).prop("disabled", true);
        $("div.invalid-feedback").remove();
        $("select,input").removeClass("is-invalid");
      },
      success: function (data) {
        $(".register").html(btn).prop("disabled", false);
        $(".registerform")[0].reset();
        toastr.success("تم تسجيل الاستمارة بنجاح");
        $(".registerBtnData").html(
          `
        <p>تم التسجيل واضافة الاستمارة بنجاح </p>
        <p>رقم الاستمارة : ` +
            data.record_id +
            `</p>
        <p>الرقم السري للاستمارة : ` +
            data.secret_number +
            `</p>
        <p>لا تفصح لأحد عن هذه البيانات وقم بالاحتفاظ بالرقم السري ورقم الاستمارة
        لانك ستقوم بإستخدام هذه البيانات فى حال وفقكم الله وتم الزواج سيتحتم عليك ساعتها
        استخدام هذه البيانات لحذف الاستمارة من النظام
          </p>
        `
        );
      },
      error: function (xhr, desc, err) {
        $(".register").html(btn).prop("disabled", false);
        //console.log(xhr.responseJSON.errors);
        var errors = xhr.responseJSON.errors;
        scrollTo(form_id + " ." + Object.keys(errors)[0]);
        $.each(errors, function (key, value) {
          $(form_id + " ." + key).addClass("is-invalid");

          if ($(form_id + " ." + key).attr("type") == "file") {
            $(form_id + " ." + key).append(
              `<div class="invalid-feedback">` + value[0] + `</div>`
            );

            $(form_id + " ." + key)
              .parent("div")
              .append(`<div class="invalid-feedback">` + value[0] + `</div>`);
          } else if ($(form_id + " ." + key + ":has(select)")) {
            $(form_id + " ." + key).append(
              `<div class="invalid-feedback">` + value[0] + `</div>`
            );

            $(form_id + " ." + key)
              .parent("div")
              .append(`<div class="invalid-feedback">` + value[0] + `</div>`);
          } else {
            $(form_id + " ." + key)
              .parent("div")
              .append(`<div class="invalid-feedback">` + value[0] + `</div>`);
          }
          $(".invalid-feedback").show();
        });
      },
    });

    return false;
  });

  $(document).on("click", ".show_number", function () {
    var getNumber = $(".getNumber").serialize();
    var url = $(".getNumber").attr("action");
    $.ajax({
      url: url,
      type: "post",
      data: getNumber,
      dataType: "html",
      beforeSend: function () {
        $(".father_number").html('<i class="fa fa-spin fa-spinner"></i>');
      },
      success: function (data) {
        $(".father_number").html(data);
      },
    });
    return false;
  });
});
