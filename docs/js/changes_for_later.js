

export function adduction_abductionV2(landmarks, joint_list = [[6, 9, 10], [10, 9, 14], [19,9,18]]) {
  
  const names = ["Index-Middle", "Middle-Ring", "Ring-Little", "Thumb"]; // Names of finger pairs
  let angle_list = [];
  for (let i = 0; i < joint_list.length; i++) {
    const [aIdx, bIdx, cIdx] = joint_list[i];
    //console.log("Calculating angle for joints:", joints[finger_index][i]);
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];
    const c = landmarks[cIdx];
    const ab = {x: a.x - b.x, y: a.y - b.y};
    const cb = {x: c.x - b.x, y: c.y - b.y};
    let radians = Math.atan2(cb.y, cb.x) - Math.atan2(ab.y, ab.x);
    let angle = radians * (180 / Math.PI); // Convert to degrees

    
    angle_list.push({name: names[i], value: Math.round(angle)});
  }
  return angle_list;
}
