export default function deepGetFromObject(obj, label) {
    const keys = label.split('.')

    let result = keys.reduce((acc, key) => {
        return (acc && acc[key] !== 'undefined') ? acc[key] : undefined
    }, obj)

    return result
}
