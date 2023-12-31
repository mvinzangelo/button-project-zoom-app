const db = require("../models");
const Lecture = db.lectures;

module.exports = {
    createLecture: function (lecture) {
        return Lecture.create({
            professorId: lecture.professorId,
            meetingUUID: lecture.meetingUUID
        })
            .then((data) => {
                console.log(data.toJSON());
                return data;
            })
            .catch((err) => {
                console.error("Error while creating lecture: ", err);
                return err;
            });
    },
    setLectureInactive: function (lectureId) {
        return Lecture.update({
            isActive: false
        }, {
            where: { id: lectureId },
            returning: true,
            plain: true
        })
            .then((data) => {
                console.log(data);
                return data;
            })
            .catch((err) => {
                console.error("Error while updating lecture: ", err);
                return err;
            });
    },
    findAll: function () {
        return Lecture.findAll({
            include: [{ model: db.button_presses, as: "button_presses" }],
        }).then((data) => {
            console.log("All lectures", JSON.stringify(data, null, 2));
            return data;
        })
    }
};
